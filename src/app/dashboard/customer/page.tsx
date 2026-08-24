import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
          <h1 className="text-xl font-semibold">My Orders</h1>
          <p className="text-sm text-muted">{orders.length} order(s)</p>
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
        <div className="grid gap-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/dashboard/customer/orders/${order.id}`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted">
                      {order.pickupZone.name} → {order.dropZone.name} · {order.orderType} ·{" "}
                      {order.paymentType}
                    </p>
                    <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatCurrency(order.totalCharge.toString())}</span>
                    <StatusBadge status={order.currentStatus} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
