import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

const STAGES = [
  {
    stamp: "BOOKED",
    stampClass: "text-route bg-route-soft",
    title: "Zone-priced on the spot",
    copy: "Pickup and drop pincode resolve to a zone, volumetric vs. actual weight is compared, and the exact charge shows before you confirm.",
  },
  {
    stamp: "ASSIGNED",
    stampClass: "text-route bg-route-soft",
    title: "Routed to the nearest agent",
    copy: "The nearest available agent in the drop zone picks it up — automatically, or handed to a specific agent by an admin.",
  },
  {
    stamp: "DELIVERED",
    stampClass: "text-cleared bg-cleared-soft",
    title: "Tracked stamp by stamp",
    copy: "Every status change is logged permanently with who made it and when. A failed drop reschedules and reassigns on its own.",
  },
] as const;

const ROLES = [
  {
    who: "Customers",
    does: "Book a parcel, see the price before confirming, and watch it move from Created to Delivered.",
  },
  {
    who: "Delivery agents",
    does: "Work a queue of assigned drops, mark pickups and deliveries, and toggle their own availability.",
  },
  {
    who: "Operations",
    does: "Draw the zone map, set rate cards, provision agents, and override any order when reality doesn't match the plan.",
  },
] as const;

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-route text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-white text-[10px] font-bold"
              style={{ transform: "rotate(-6deg)" }}
            >
              LM
            </span>
            <span className="font-display text-sm font-bold uppercase tracking-[0.14em]">
              Last-Mile Tracker
            </span>
          </div>
          <Link
            href="/login"
            className="rounded-[3px] border-[1.5px] border-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <div>
          <p className="font-manifest text-xs font-semibold uppercase tracking-[0.2em] text-manifest">
            Zone-priced &middot; Auto-assigned &middot; Fully tracked
          </p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            Every parcel gets a manifest, not a guess.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft">
            Book a delivery and watch it get priced by zone, handed to the
            nearest available agent, and tracked with an audit trail that
            can&apos;t be edited after the fact — only added to.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg">Book a delivery</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* Signature element: a mock waybill, the concrete artifact this product produces */}
        <div
          className="mx-auto w-full max-w-sm rotate-1 rounded-[6px] border-[1.5px] border-ink/15 bg-paper-raised p-5 shadow-[6px_6px_0_0_var(--line)]"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Tracking No.
              </p>
              <p className="font-manifest text-lg font-medium tracking-wide text-ink">
                LM-20260824-K3F9X2
              </p>
            </div>
            <span className="ink-stamp text-hold bg-hold-soft">In Transit</span>
          </div>

          <hr className="stub-divider my-4" />

          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                From
              </dt>
              <dd className="font-manifest text-ink">South Zone</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                To
              </dt>
              <dd className="font-manifest text-ink">North Zone</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Chargeable Wt.
              </dt>
              <dd className="font-manifest text-ink">6.0 kg</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Total
              </dt>
              <dd className="font-manifest text-ink">₹130.19</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-y-[1.5px] border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-xl font-bold text-ink">Book, assign, track.</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {STAGES.map((stage) => (
              <div key={stage.stamp}>
                <span className={`ink-stamp ${stage.stampClass}`}>{stage.stamp}</span>
                <h3 className="font-display mt-3 text-base font-semibold text-ink">
                  {stage.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{stage.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-xl font-bold text-ink">Built for the whole run</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ROLES.map((role) => (
            <div
              key={role.who}
              className="rounded-[5px] border-[1.5px] border-line bg-paper-raised p-5"
            >
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-route">
                {role.who}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{role.does}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-route">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-bold text-white">
            Ready to stamp your first parcel?
          </h2>
          <div className="flex gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-white text-route shadow-[0_2px_0_0_rgba(255,255,255,0.4)] hover:bg-white/90">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
