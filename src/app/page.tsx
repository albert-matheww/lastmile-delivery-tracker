import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-primary">
        Last-Mile Delivery Tracker
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
        Auto-priced orders, smart agent assignment, live tracking.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Zone-aware rate calculation for B2B and B2C, nearest-available-agent
        auto-assignment, an immutable status timeline, and email updates at
        every step.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/register">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="secondary">
            Sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
