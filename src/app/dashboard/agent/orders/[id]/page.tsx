import { requireRole } from "@/lib/auth/session";
import { loadOrderForViewer } from "@/lib/orders/access";
import { OrderSummary } from "@/components/orders/order-summary";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { StatusUpdateControls } from "@/components/orders/status-update-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_TRANSITIONS, AGENT_SETTABLE_STATUSES } from "@/lib/orders/status-machine";

export default async function AgentOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("AGENT");
  const order = await loadOrderForViewer(id, user);

  const nextStatuses = ORDER_TRANSITIONS[order.currentStatus].filter((s) =>
    AGENT_SETTABLE_STATUSES.includes(s)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <OrderSummary order={order} />
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          {nextStatuses.length > 0 ? (
            <StatusUpdateControls orderId={order.id} nextStatuses={nextStatuses} />
          ) : (
            <p className="text-sm text-muted">No further action needed on this order right now.</p>
          )}
        </CardContent>
      </Card>
      <OrderTimeline history={order.statusHistory} />
    </div>
  );
}
