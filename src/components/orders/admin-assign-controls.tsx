"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

type AgentOption = { id: string; label: string; zoneName: string };

export function AdminAssignControls({
  orderId,
  agents,
}: {
  orderId: string;
  agents: AgentOption[];
}) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [loading, setLoading] = useState<"auto" | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function assign(body: object, mode: "auto" | "manual") {
    setError(null);
    setLoading(mode);
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not assign order");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign order");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-56">
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} · {a.zoneName}
            </option>
          ))}
        </Select>
        <Button
          variant="secondary"
          disabled={!agentId || loading !== null}
          onClick={() => assign({ mode: "manual", agentId }, "manual")}
        >
          {loading === "manual" ? "Assigning..." : "Assign selected agent"}
        </Button>
        <Button disabled={loading !== null} onClick={() => assign({ mode: "auto" }, "auto")}>
          {loading === "auto" ? "Assigning..." : "Auto-assign nearest agent"}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
