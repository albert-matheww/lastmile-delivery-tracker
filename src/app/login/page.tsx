"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span
            aria-hidden
            className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-ink text-[10px] font-bold"
            style={{ transform: "rotate(-6deg)" }}
          >
            LM
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Last-Mile Tracker
          </span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Track a parcel from booking to doorstep</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted">
              No account?{" "}
              <Link href="/register" className="font-medium text-route hover:underline">
                Register
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-4 rounded-[5px] border-[1.5px] border-dashed border-line-strong bg-paper-raised p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Demo access
          </p>
          <p className="font-manifest mt-1 text-xs text-ink">
            admin@lastmile.demo · priya@lastmile.demo · nikhil@lastmile.demo
          </p>
          <p className="font-manifest mt-0.5 text-xs text-ink-soft">
            password: Password123!
          </p>
        </div>
      </div>
    </div>
  );
}
