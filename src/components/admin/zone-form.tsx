"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ZoneForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create zone");
      setName("");
      setCode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create zone");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label>Zone name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North Zone" />
      </div>
      <div>
        <Label>Code</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. N" className="w-24" />
      </div>
      <Button onClick={submit} disabled={!name || !code || loading}>
        {loading ? "Adding..." : "Add zone"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
