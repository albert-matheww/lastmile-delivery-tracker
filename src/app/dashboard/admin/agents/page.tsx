import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentForm } from "@/components/admin/agent-form";
import { AdminAgentRow } from "@/components/admin/agent-row";

export default async function AdminAgentsPage() {
  await requireRole("ADMIN");
  const [zones, agents] = await Promise.all([
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
    prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true } },
        zone: { select: { name: true } },
        _count: {
          select: {
            assignedOrders: {
              where: { currentStatus: { notIn: ["DELIVERED", "FAILED"] } },
            },
          },
        },
      },
    }),
  ]);

  const zoneOptions = zones.map((z) => ({ id: z.id, name: z.name }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Agents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {zones.length === 0 ? (
          <p className="text-sm text-muted">Create a zone first before adding agents.</p>
        ) : (
          <AgentForm zones={zoneOptions} />
        )}
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Agent</th>
                <th className="px-4 py-2 font-medium">Zone</th>
                <th className="px-4 py-2 font-medium">Availability</th>
                <th className="px-4 py-2 font-medium">Active orders</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <AdminAgentRow
                  key={a.id}
                  agentId={a.id}
                  name={a.user.name}
                  email={a.user.email}
                  zoneId={a.zoneId}
                  availability={a.availability}
                  activeOrders={a._count.assignedOrders}
                  zones={zoneOptions}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
