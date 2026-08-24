import { prisma } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import type { Agent } from "@/generated/prisma/client";

/**
 * Nearest-available-agent selection.
 *
 * "Nearest" is modeled as zone-based rather than lat/lng distance: the
 * spec's own inputs (pickup/drop address + pincode) don't carry
 * coordinates, and real last-mile networks route through a zone hub
 * anyway, so an agent's home zone is the meaningful proximity signal.
 * We pick agents assigned to the order's DROP zone (the leg this
 * platform models as "last-mile" is hub -> final address, so the agent
 * who owns that zone is the one who should carry it), among those
 * marked AVAILABLE, breaking ties by current active-order load (fewest
 * in-flight orders first) then by seniority for determinism.
 *
 * A real deployment with live agent GPS would swap this for a
 * haversine/PostGIS nearest-neighbor query without touching callers —
 * the interface (zoneId in, Agent out) stays the same.
 */
export async function findBestAgentForZone(zoneId: string): Promise<Agent | null> {
  const agents = await prisma.agent.findMany({
    where: { zoneId, availability: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
  });
  if (agents.length === 0) return null;

  const loadCounts = await prisma.order.groupBy({
    by: ["assignedAgentId"],
    where: {
      assignedAgentId: { in: agents.map((a) => a.id) },
      currentStatus: { notIn: ["DELIVERED", "FAILED"] },
    },
    _count: { _all: true },
  });
  const loadByAgent = new Map(
    loadCounts.map((l) => [l.assignedAgentId as string, l._count._all])
  );

  const sorted = [...agents].sort((a, b) => {
    const loadDiff = (loadByAgent.get(a.id) ?? 0) - (loadByAgent.get(b.id) ?? 0);
    if (loadDiff !== 0) return loadDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return sorted[0];
}

export async function findBestAgentForZoneOrThrow(zoneId: string): Promise<Agent> {
  const agent = await findBestAgentForZone(zoneId);
  if (!agent) {
    throw new AppError(
      "No available delivery agent in this order's zone right now. Assign one manually or try auto-assign again later.",
      409
    );
  }
  return agent;
}
