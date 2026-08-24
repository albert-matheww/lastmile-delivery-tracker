"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function AreaForm({ zones }: { zones: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [label, setLabel] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, label, zoneId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not map pincode");
      setPincode("");
      setLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not map pincode");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label>Pincode</Label>
        <Input value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-32" />
      </div>
      <div>
        <Label>Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Koramangala" />
      </div>
      <div>
        <Label>Zone</Label>
        <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-40">
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </Select>
      </div>
      <Button onClick={submit} disabled={!pincode || !label || !zoneId || loading}>
        {loading ? "Adding..." : "Map pincode"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
