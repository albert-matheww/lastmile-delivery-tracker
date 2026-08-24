import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { Card, CardContent } from "@/components/ui/card";
import { AvailabilityToggle } from "@/components/orders/availability-toggle";
import { OrderTicketCard } from "@/components/orders/order-ticket-card";

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
          <h1 className="font-display text-xl font-bold text-ink">My Deliveries</h1>
          <p className="text-sm text-ink-soft">{activeOrders.length} active</p>
        </div>
        {agent && <AvailabilityToggle current={agent.availability} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {orders.length === 0 && (
          <Card className="sm:col-span-2">
            <CardContent className="py-10 text-center text-muted">
              No orders assigned yet.
            </CardContent>
          </Card>
        )}
        {[...activeOrders, ...pastOrders].map((order) => (
          <OrderTicketCard
            key={order.id}
            href={`/dashboard/agent/orders/${order.id}`}
            orderNumber={order.orderNumber}
            routeLabel={`${order.pickupZone.name} → ${order.dropZone.name}`}
            meta={`${order.orderType} · ${order.paymentType}`}
            createdAt={order.createdAt}
            totalCharge={order.totalCharge.toString()}
            status={order.currentStatus}
          />
        ))}
      </div>
    </div>
  );
}
