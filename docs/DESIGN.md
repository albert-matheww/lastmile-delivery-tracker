# System Design

## Rate calculation engine

The engine is a pure function, `calculateCharge()` in
`src/lib/orders/rate-engine.ts`, deliberately kept free of database
access so it's cheap to unit test exhaustively (see
`rate-engine.test.ts`) — correctness here matters more than almost
anywhere else in the app, since it's what the customer is billed.

Volumetric weight is `L × B × H ÷ 5000` (cm → kg), and the chargeable
weight is `max(actual, volumetric)`, per the spec. The charge itself is
`baseFee + perKgRate × chargeableWeight`, plus a COD surcharge
(`flatFee + percentOfCharge × baseCharge`) when `paymentType === COD`.
All money math uses `Prisma.Decimal`, never floating-point, to avoid
rounding drift.

The one real design decision is the shape of the rate card. The spec
asks for "rate cards (intra and inter-zone rates separately for B2B and
B2C)." A literal zone×zone matrix would need `O(zones²)` rows and force
every new zone to require re-seeding every existing zone's rates before
the system was usable. Instead, `RateCard` is keyed on
`(orderType, zoneRelation)` where `zoneRelation` is just `INTRA` or
`INTER` — one rate for "same zone," one for "different zone," per order
type. This is a flatter model than a full matrix, admin-configurable
with no hardcoding (satisfying the technical requirement), and matches
the spec's own wording more closely than a matrix would. The tradeoff
is that all inter-zone deliveries cost the same regardless of *which*
two zones — acceptable for a system whose zones are pincode groupings,
not literal geography with wildly different real transport costs.
`buildQuote()` in `quote.ts` is the DB-loading orchestrator: resolve
zones, load the matching `RateCard` + `CodSurchargeConfig`, delegate to
the pure function. `POST /api/quote` runs this without creating an
order, so the frontend shows the price before the customer confirms.

## Zone detection

Rather than integrating a geocoding API, zone detection is a plain
admin-managed lookup table: `Area` maps a `pincode` to a `Zone`. Order
creation resolves pickup and drop zones with a single indexed query each
(`resolveZoneForPincode`). This is intentional, not a shortcut: the
spec's own order inputs are addresses *and* pincodes, geocoding would
add an external dependency and latency for zero functional gain over a
lookup table admins already have to maintain (they're the ones defining
what a "zone" means for their operation), and it keeps zone assignment
fully deterministic and testable. If a pincode isn't mapped yet, order
creation fails with a clear 422 telling the admin what to fix, rather
than guessing.

## Auto-assignment logic

"Nearest available agent" is modeled as zone-based rather than
lat/lng-distance-based, for the same reason zone detection isn't
geocoded: the order's own inputs don't carry coordinates. `Agent` has a
home `zone` and an `availability` (`AVAILABLE`/`BUSY`/`OFFLINE`).
`findBestAgentForZone()` filters to available agents in the order's
**drop** zone (the leg this platform treats as "last-mile" — hub to
final address — is owned by the agent based in that destination zone),
then breaks ties by current active-order load (fewest in-flight orders
first, a simple load-balance), then by agent seniority for
determinism. If a real deployment later has live agent GPS, this
function's interface (`zoneId` in, `Agent` out) doesn't need to change —
only its internals would swap to a haversine or PostGIS nearest-neighbor
query. Both manual assignment (admin picks a specific agent) and
auto-assignment funnel through the same `assignOrderToAgent()`, which
writes `Order.assignedAgentId`, moves status to `ASSIGNED`, and appends
an immutable `OrderStatusHistory` row — so the two paths can never drift
in behavior.

## Order lifecycle and failed-delivery handling

Status transitions are enforced by an explicit table in
`status-machine.ts` (`CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT →
OUT_FOR_DELIVERY → DELIVERED`, with `OUT_FOR_DELIVERY → FAILED` as the
other branch), checked by `assertValidTransition()` on every write.
Every change — normal or admin override — is appended to
`OrderStatusHistory` (insert-only; `Order.currentStatus` is a
denormalized pointer to the latest row) with the acting user, their
role, and a timestamp, giving a genuinely immutable audit trail rather
than one enforced only by convention.

On `FAILED`, the customer is notified and can call
`POST /orders/:id/reschedule` with a new date. Per the spec ("agent is
reassigned for the rescheduled attempt"), this single action both sets
`RESCHEDULED` + the new date *and* re-runs the same auto-assignment
logic used elsewhere — it doesn't wait for a separate manual step. The
status re-enters at `OUT_FOR_DELIVERY`, not `PICKED_UP`, because the
package is already with an agent; only the delivery attempt itself is
retried, and it can loop through `FAILED → RESCHEDULED` again if needed.
`ADMIN` can force any transition via the same status endpoint
(`allowAny`), for correcting real-world exceptions the state machine
doesn't anticipate.
