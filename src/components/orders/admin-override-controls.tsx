"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import type { OrderStatus } from "@/generated/prisma/client";

const ALL_STATUSES: OrderStatus[] = [
  "CREATED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RESCHEDULED",
];

export function AdminOverrideControls({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function override() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not override status");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not override status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="w-48">
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button variant="danger" onClick={override} disabled={loading}>
          {loading ? "Overriding..." : "Force set status"}
        </Button>
      </div>
      <Textarea
        placeholder="Optional note for the audit log"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-muted">
        Admin overrides bypass the normal transition rules and are recorded in the timeline like any
        other status change.
      </p>
    </div>
  );
}
