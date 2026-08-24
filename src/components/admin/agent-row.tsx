"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import type { AgentAvailability } from "@/generated/prisma/client";

export function AdminAgentRow({
  agentId,
  name,
  email,
  zoneId,
  availability,
  activeOrders,
  zones,
}: {
  agentId: string;
  name: string;
  email: string;
  zoneId: string;
  availability: AgentAvailability;
  activeOrders: number;
  zones: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function patch(body: object) {
    setSaving(true);
    try {
      await fetch(`/api/admin/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2">
        <p>{name}</p>
        <p className="text-xs text-muted">{email}</p>
      </td>
      <td className="px-4 py-2">
        <Select
          defaultValue={zoneId}
          disabled={saving}
          onChange={(e) => patch({ zoneId: e.target.value })}
          className="w-36"
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-2">
        <Select
          defaultValue={availability}
          disabled={saving}
          onChange={(e) => patch({ availability: e.target.value })}
          className="w-32"
        >
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="OFFLINE">Offline</option>
        </Select>
      </td>
      <td className="px-4 py-2">{activeOrders}</td>
    </tr>
  );
}
