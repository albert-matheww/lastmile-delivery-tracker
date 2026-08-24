# Last-Mile Delivery Tracker

A delivery management platform: customers and admins create orders with
auto-calculated charges, agents get assigned intelligently (manually or
via nearest-available-agent auto-assignment), and customers are notified
by email at every status change, with a full immutable tracking history.

Full system design rationale (rate engine, zone detection, auto-assignment,
failed-delivery handling): see [`docs/DESIGN.md`](docs/DESIGN.md).

## Stack

- **Next.js 16** (App Router, TypeScript) — single full-stack app: React UI
  + REST-style API routes under `src/app/api/*`, one deploy target.
- **PostgreSQL + Prisma 7** (`@prisma/adapter-pg`) — the domain is
  relational (zones, rate cards, orders, immutable status history), so a
  relational DB with a type-safe ORM was the right fit over NoSQL.
- **JWT session cookie** (httpOnly, `jsonwebtoken` + `bcryptjs`) — simple
  role-based auth (`CUSTOMER` / `AGENT` / `ADMIN`) without pulling in a
  full auth framework for a three-role app.
- **Zod** — request validation on every API route.
- **Tailwind CSS v4** with a small hand-rolled component set
  (`src/components/ui/*`) — no external component library dependency.
- **Vitest** — unit tests for the two pieces of pure business logic that
  most need correctness guarantees: the rate engine and the order status
  state machine (`src/lib/orders/*.test.ts`).
- **Resend** (email) / **Twilio REST API** (SMS) — both are optional. With
  no API key configured, a console-logging provider is used instead (see
  `src/lib/notifications/providers.ts`), and every attempt — sent or not —
  is recorded in the `NotificationLog` table either way.

## Setup

Prerequisites: Node 20+, a PostgreSQL server.

```bash
npm install
cp .env.example .env
# edit .env — at minimum set DATABASE_URL to a real Postgres database
# and JWT_SECRET to a random string (openssl rand -base64 48)

npx prisma migrate dev   # creates the database schema
npm run db:seed          # zones, rate cards, demo users, demo orders

npm run dev              # http://localhost:3000
```

### Demo accounts (from the seed script)

All use password `Password123!`.

| Role | Email |
|---|---|
| Admin | `admin@lastmile.demo` |
| Customer | `priya@lastmile.demo`, `rahul@lastmile.demo`, `meera@lastmile.demo` |
| Agent | `nikhil@lastmile.demo` (North), `sana@lastmile.demo` (South), `ehsan@lastmile.demo` (East), `wendy@lastmile.demo` (West) |

### Scripts

```bash
npm run dev          # dev server
npm run build         # production build
npm run typecheck     # tsc --noEmit
npm run test          # vitest run
npm run db:migrate    # prisma migrate dev
npm run db:seed       # prisma db seed
npm run db:studio     # prisma studio (browse the DB)
```

## Database schema

See [`prisma/schema.prisma`](prisma/schema.prisma) for the full source of
truth. Summary:

- **User** — `role` is one of `CUSTOMER` / `AGENT` / `ADMIN`.
- **Zone** / **Area** — `Area` maps a pincode to a `Zone`; this *is* the
  zone-detection mechanism (see design doc).
- **RateCard** — one row per `(orderType, zoneRelation)` pair
  (`zoneRelation` is `INTRA` or `INTER`), holding `baseFee` + `perKgRate`.
- **CodSurchargeConfig** — one row per `orderType`, holding `flatFee` +
  `percentOfCharge`.
- **Agent** — one-to-one with a `User` (role `AGENT`); has a home `Zone`
  and an `availability` (`AVAILABLE` / `BUSY` / `OFFLINE`).
- **Order** — the full order record: pickup/drop address+pincode+zone,
  dimensions, weights, computed charge breakdown, `currentStatus`
  (denormalized "latest" pointer), `assignedAgentId`, reschedule fields.
- **OrderStatusHistory** — insert-only audit trail: every status change,
  who made it (`actorId` + `actorRole`), and when. Never updated or
  deleted; `Order.currentStatus` is the fast-read denormalization of "the
  last row in this table for this order."
- **NotificationLog** — every notification attempt (sent or failed), for
  auditability.

## Rate calculation logic

Implemented as a pure function in
[`src/lib/orders/rate-engine.ts`](src/lib/orders/rate-engine.ts)
(`calculateCharge`), unit-tested in
[`rate-engine.test.ts`](src/lib/orders/rate-engine.test.ts), with a
DB-loading wrapper in
[`quote.ts`](src/lib/orders/quote.ts) (`buildQuote`) that resolves zones
and loads the matching admin-configured `RateCard`/`CodSurchargeConfig`.

1. **Volumetric weight** = `L × B × H ÷ 5000` (cm → kg).
2. **Chargeable weight** = `max(actual, volumetric)`.
3. **Zone relation** = `INTRA` if pickup zone == drop zone, else `INTER`.
4. **Base charge** = `rateCard.baseFee + rateCard.perKgRate × chargeableWeight`,
   where `rateCard` is looked up by `(orderType, zoneRelation)` — fully
   admin-configurable, nothing hardcoded.
5. **COD surcharge** (only if `paymentType === COD`) =
   `codConfig.flatFee + codConfig.percentOfCharge × baseCharge`.
6. **Total** = `baseCharge + codSurcharge`.

`POST /api/quote` runs this without creating an order, so the frontend can
show the computed charge before the customer confirms (per spec). Money
math uses `Prisma.Decimal` throughout, never floating-point `number`, to
avoid rounding drift on currency values.

## API overview

All routes return JSON and use the session cookie for auth (see
`src/lib/auth/session.ts` — `requireUser` / `requireRole`). Full request/
response shapes are defined by the Zod schemas in
`src/lib/validation/schemas.ts` and enforced per-route (never trust
`proxy.ts` alone — see the comment at the top of `src/proxy.ts`).

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/register` | public | Create a `CUSTOMER` account |
| `POST /api/auth/login` / `logout` | public | Session cookie |
| `GET /api/auth/me` | any | Current session user |
| `POST /api/quote` | any | Charge preview, no order created |
| `GET /api/orders` | any | List orders, scoped to the caller's role; admin gets `status`/`zoneId`/`agentId` filters |
| `POST /api/orders` | customer/admin | Create an order (admin must pass `customerEmail`) |
| `GET /api/orders/:id` | scoped | Order detail + full status history |
| `PATCH /api/orders/:id/status` | agent (own order, forward-only) / admin (any status) | Progress or override status |
| `POST /api/orders/:id/assign` | admin | `{mode:"auto"}` or `{mode:"manual", agentId}` |
| `POST /api/orders/:id/reschedule` | customer (own, `FAILED` only) / admin | Reschedule + auto-reassign |
| `GET/POST /api/admin/zones` | admin | Zones |
| `GET/POST /api/admin/areas` | admin | Pincode → zone mapping |
| `GET/POST /api/admin/rate-cards` | admin | Rate card upsert |
| `GET/POST /api/admin/cod-surcharge` | admin | COD surcharge upsert |
| `GET/POST /api/admin/agents`, `PATCH /api/admin/agents/:id` | admin | Provision/update agents |
| `PATCH /api/agent/availability` | agent | Toggle own availability |

## Order status lifecycle

```
CREATED -> ASSIGNED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
                                                          |
                                                          v
                                                        FAILED -> RESCHEDULED -> OUT_FOR_DELIVERY (loop)
```

Enforced by `src/lib/orders/status-machine.ts`; `ADMIN` can override to
any status regardless of the graph (spec: "override any order status").
`RESCHEDULED` re-enters at `OUT_FOR_DELIVERY` (not `PICKED_UP`) because
the package is already with the agent — only the delivery attempt is
retried.

## Notes on what's simplified, and why

- **Zone detection** is a pincode → zone lookup table, not geocoding —
  see design doc.
- **Auto-assignment** is zone-based (agent's home zone), not lat/lng
  distance — the spec's own order inputs don't carry coordinates.
- **Rate cards** are one row per `(orderType, zoneRelation)`, not a full
  zone×zone matrix — matches the spec's literal wording ("intra and
  inter-zone rates ... for B2B and B2C") and avoids needing to seed
  `zones²` rows for the deployment to be usable.

None of these are technical shortcuts — they're the smallest model that
satisfies every requirement in the spec; see `docs/DESIGN.md` for the
full reasoning.
