"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RescheduleForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate: date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reschedule");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reschedule");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-danger/30">
      <CardHeader>
        <CardTitle>Delivery failed — reschedule</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="reschedule-date">New delivery date</Label>
          <Input
            id="reschedule-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button onClick={submit} disabled={!date || loading}>
          {loading ? "Rescheduling..." : "Reschedule delivery"}
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}
