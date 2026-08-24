"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { OrderStatus } from "@/generated/prisma/client";

const LABELS: Partial<Record<OrderStatus, string>> = {
  PICKED_UP: "Mark Picked Up",
  IN_TRANSIT: "Mark In Transit",
  OUT_FOR_DELIVERY: "Mark Out for Delivery",
  DELIVERED: "Mark Delivered",
  FAILED: "Mark Failed",
};

export function StatusUpdateControls({
  orderId,
  nextStatuses,
}: {
  orderId: string;
  nextStatuses: OrderStatus[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const needsNote = nextStatuses.includes("FAILED");

  async function setStatus(status: OrderStatus) {
    setError(null);
    setLoading(status);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update status");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setLoading(null);
    }
  }

  if (nextStatuses.length === 0) return null;

  return (
    <div className="space-y-3">
      {needsNote && (
        <Textarea
          placeholder="Reason for failed delivery (shown to the customer)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <Button
            key={status}
            variant={status === "FAILED" ? "danger" : "primary"}
            onClick={() => setStatus(status)}
            disabled={loading !== null}
          >
            {loading === status ? "Updating..." : LABELS[status] ?? status}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
