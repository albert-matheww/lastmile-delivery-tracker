"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function CodSurchargeForm() {
  const router = useRouter();
  const [orderType, setOrderType] = useState<"B2B" | "B2C">("B2C");
  const [flatFee, setFlatFee] = useState("");
  const [percentOfCharge, setPercentOfCharge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cod-surcharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          flatFee: Number(flatFee),
          percentOfCharge: Number(percentOfCharge) / 100,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save COD surcharge");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save COD surcharge");
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
        <Label>Flat fee (₹)</Label>
        <Input type="number" min="0" step="0.01" value={flatFee} onChange={(e) => setFlatFee(e.target.value)} className="w-28" />
      </div>
      <div>
        <Label>+ Percent of charge (%)</Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={percentOfCharge}
          onChange={(e) => setPercentOfCharge(e.target.value)}
          className="w-28"
        />
      </div>
      <Button onClick={submit} disabled={!flatFee || loading}>
        {loading ? "Saving..." : "Save COD surcharge"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
