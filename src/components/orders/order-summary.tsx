import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { OrderWithDetail } from "@/lib/orders/access";

export function OrderSummary({ order }: { order: OrderWithDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-mono">{order.orderNumber}</CardTitle>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.currentStatus} />
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Pickup</h3>
          <p className="text-sm">{order.pickupAddress}</p>
          <p className="text-sm text-muted">
            {order.pickupPincode} · {order.pickupZone.name}
          </p>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Drop</h3>
          <p className="text-sm">{order.dropAddress}</p>
          <p className="text-sm text-muted">
            {order.dropPincode} · {order.dropZone.name}
          </p>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Package</h3>
          <p className="text-sm">
            {order.lengthCm.toString()} × {order.breadthCm.toString()} × {order.heightCm.toString()} cm
          </p>
          <p className="text-sm text-muted">
            Actual {order.actualWeightKg.toString()}kg · Volumetric{" "}
            {order.volumetricWeightKg.toString()}kg · Chargeable {order.chargeableWeightKg.toString()}kg
          </p>
          <p className="text-sm text-muted">
            {order.orderType} · {order.paymentType}
          </p>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Charge</h3>
          <div className="space-y-0.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Base fee</span>
              <span>{formatCurrency(order.baseFee.toString())}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Weight charge</span>
              <span>{formatCurrency(order.weightCharge.toString())}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">COD surcharge</span>
              <span>{formatCurrency(order.codSurcharge.toString())}</span>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.totalCharge.toString())}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Customer</h3>
          <p className="text-sm">{order.customer.name}</p>
          <p className="text-sm text-muted">{order.customer.email}</p>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Delivery agent
          </h3>
          {order.assignedAgent ? (
            <>
              <p className="text-sm">{order.assignedAgent.user.name}</p>
              <p className="text-sm text-muted">{order.assignedAgent.user.email}</p>
            </>
          ) : (
            <p className="text-sm text-muted">Not yet assigned</p>
          )}
        </div>
        {order.rescheduleDate && (
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Rescheduled for
            </h3>
            <p className="text-sm">{new Date(order.rescheduleDate).toDateString()}</p>
          </div>
        )}
        {order.lastFailureNote && (
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Last failure reason
            </h3>
            <p className="text-sm text-danger">{order.lastFailureNote}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
