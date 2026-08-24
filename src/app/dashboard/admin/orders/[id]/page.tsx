import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { loadOrderForViewer } from "@/lib/orders/access";
import { OrderSummary } from "@/components/orders/order-summary";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { AdminAssignControls } from "@/components/orders/admin-assign-controls";
import { AdminOverrideControls } from "@/components/orders/admin-override-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("ADMIN");
  const order = await loadOrderForViewer(id, user);

  const agents = await prisma.agent.findMany({
    where: { availability: "AVAILABLE" },
    orderBy: [{ zoneId: "desc" }, { createdAt: "asc" }],
    include: { user: { select: { name: true } }, zone: { select: { name: true } } },
  });

  const agentOptions = agents.map((a) => ({
    id: a.id,
    label: a.user.name,
    zoneName: a.zone.name,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <OrderSummary order={order} />

      <Card>
        <CardHeader>
          <CardTitle>Assign Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {agentOptions.length > 0 ? (
            <AdminAssignControls orderId={order.id} agents={agentOptions} />
          ) : (
            <p className="text-sm text-muted">No available agents right now.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Override Status</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminOverrideControls orderId={order.id} currentStatus={order.currentStatus} />
        </CardContent>
      </Card>

      <OrderTimeline history={order.statusHistory} />
    </div>
  );
}
