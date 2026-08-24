"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import type { AgentAvailability } from "@/generated/prisma/client";

export function AvailabilityToggle({ current }: { current: AgentAvailability }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);

  async function onChange(next: AgentAvailability) {
    setValue(next);
    setLoading(true);
    try {
      await fetch("/api/agent/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted">Availability</span>
      <Select
        value={value}
        disabled={loading}
        onChange={(e) => onChange(e.target.value as AgentAvailability)}
        className="w-36"
      >
        <option value="AVAILABLE">Available</option>
        <option value="BUSY">Busy</option>
        <option value="OFFLINE">Offline</option>
      </Select>
    </div>
  );
}
