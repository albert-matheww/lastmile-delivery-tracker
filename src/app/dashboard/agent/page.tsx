import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AvailabilityToggle } from "@/components/orders/availability-toggle";
import { formatDateTime } from "@/lib/utils";

export default async function AgentDashboardPage() {
  const user = await requireRole("AGENT");
  const agent = await prisma.agent.findUnique({ where: { userId: user.sub } });

  const orders = agent
    ? await prisma.order.findMany({
        where: { assignedAgentId: agent.id },
        orderBy: { createdAt: "desc" },
        include: {
          pickupZone: { select: { name: true } },
          dropZone: { select: { name: true } },
        },
      })
    : [];

  const activeOrders = orders.filter((o) => !["DELIVERED", "FAILED"].includes(o.currentStatus));
  const pastOrders = orders.filter((o) => ["DELIVERED", "FAILED"].includes(o.currentStatus));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Deliveries</h1>
          <p className="text-sm text-muted">{activeOrders.length} active</p>
        </div>
        {agent && <AvailabilityToggle current={agent.availability} />}
      </div>

      <div className="grid gap-3">
        {orders.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted">
              No orders assigned yet.
            </CardContent>
          </Card>
        )}
        {[...activeOrders, ...pastOrders].map((order) => (
          <Link key={order.id} href={`/dashboard/agent/orders/${order.id}`}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted">
                    {order.pickupZone.name} → {order.dropZone.name}
                  </p>
                  <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.currentStatus} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
