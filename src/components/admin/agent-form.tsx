"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function AgentForm({ zones }: { zones: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, zoneId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create agent");
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create agent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Temporary password</Label>
        <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
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
      <Button onClick={submit} disabled={!name || !email || !password || !zoneId || loading}>
        {loading ? "Creating..." : "Add agent"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
