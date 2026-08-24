import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderTicketCard } from "@/components/orders/order-ticket-card";

export default async function CustomerOrdersPage() {
  const user = await getCurrentUser();
  const orders = await prisma.order.findMany({
    where: { customerId: user!.sub },
    orderBy: { createdAt: "desc" },
    include: {
      pickupZone: { select: { name: true } },
      dropZone: { select: { name: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">My Orders</h1>
          <p className="text-sm text-ink-soft">{orders.length} order(s)</p>
        </div>
        <Link href="/dashboard/customer/new">
          <Button>New Order</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted">
            No orders yet. Create your first order to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders.map((order) => (
            <OrderTicketCard
              key={order.id}
              href={`/dashboard/customer/orders/${order.id}`}
              orderNumber={order.orderNumber}
              routeLabel={`${order.pickupZone.name} → ${order.dropZone.name}`}
              meta={`${order.orderType} · ${order.paymentType}`}
              createdAt={order.createdAt}
              totalCharge={order.totalCharge.toString()}
              status={order.currentStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
