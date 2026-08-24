"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function RateCardForm() {
  const router = useRouter();
  const [orderType, setOrderType] = useState<"B2B" | "B2C">("B2C");
  const [zoneRelation, setZoneRelation] = useState<"INTRA" | "INTER">("INTRA");
  const [baseFee, setBaseFee] = useState("");
  const [perKgRate, setPerKgRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          zoneRelation,
          baseFee: Number(baseFee),
          perKgRate: Number(perKgRate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save rate card");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save rate card");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label>Order type</Label>
        <Select value={orderType} onChange={(e) => setOrderType(e.target.value as "B2B" | "B2C")} className="w-28">
          <option value="B2C">B2C</option>
          <option value="B2B">B2B</option>
        </Select>
      </div>
      <div>
        <Label>Zone relation</Label>
        <Select
          value={zoneRelation}
          onChange={(e) => setZoneRelation(e.target.value as "INTRA" | "INTER")}
          className="w-32"
        >
          <option value="INTRA">Intra-zone</option>
          <option value="INTER">Inter-zone</option>
        </Select>
      </div>
      <div>
        <Label>Base fee (₹)</Label>
        <Input type="number" min="0" step="0.01" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} className="w-28" />
      </div>
      <div>
        <Label>Per-kg rate (₹)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={perKgRate}
          onChange={(e) => setPerKgRate(e.target.value)}
          className="w-28"
        />
      </div>
      <Button onClick={submit} disabled={!baseFee || !perKgRate || loading}>
        {loading ? "Saving..." : "Save rate card"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
