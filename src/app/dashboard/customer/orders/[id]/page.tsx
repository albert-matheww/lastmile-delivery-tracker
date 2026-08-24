import { requireUser } from "@/lib/auth/session";
import { loadOrderForViewer } from "@/lib/orders/access";
import { OrderSummary } from "@/components/orders/order-summary";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { RescheduleForm } from "@/components/orders/reschedule-form";

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const order = await loadOrderForViewer(id, user);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <OrderSummary order={order} />
      {order.currentStatus === "FAILED" && <RescheduleForm orderId={order.id} />}
      <OrderTimeline history={order.statusHistory} />
    </div>
  );
}
