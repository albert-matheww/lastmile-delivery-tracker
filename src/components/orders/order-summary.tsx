import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { OrderWithDetail } from "@/lib/orders/access";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </h3>
      {children}
    </div>
  );
}

export function OrderSummary({ order }: { order: OrderWithDetail }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
            Tracking No.
          </p>
          <p className="font-manifest text-lg font-medium tracking-wide text-ink">
            {order.orderNumber}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.currentStatus} />
      </div>
      <hr className="stub-divider mx-5 mt-4" />
      <CardContent className="grid gap-6 pt-4 sm:grid-cols-2">
        <Field label="Pickup">
          <p className="text-sm text-ink">{order.pickupAddress}</p>
          <p className="font-manifest text-sm text-ink-soft">
            {order.pickupPincode} · {order.pickupZone.name}
          </p>
        </Field>
        <Field label="Drop">
          <p className="text-sm text-ink">{order.dropAddress}</p>
          <p className="font-manifest text-sm text-ink-soft">
            {order.dropPincode} · {order.dropZone.name}
          </p>
        </Field>
        <Field label="Package">
          <p className="font-manifest text-sm text-ink">
            {order.lengthCm.toString()} × {order.breadthCm.toString()} × {order.heightCm.toString()} cm
          </p>
          <p className="font-manifest text-sm text-ink-soft">
            Actual {order.actualWeightKg.toString()}kg · Volumetric{" "}
            {order.volumetricWeightKg.toString()}kg · Chargeable {order.chargeableWeightKg.toString()}kg
          </p>
          <p className="mt-0.5 text-sm text-ink-soft">
            {order.orderType} · {order.paymentType}
          </p>
        </Field>
        <Field label="Charge">
          <div className="font-manifest space-y-0.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="font-body text-ink-soft">Base fee</span>
              <span>{formatCurrency(order.baseFee.toString())}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-body text-ink-soft">Weight charge</span>
              <span>{formatCurrency(order.weightCharge.toString())}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-body text-ink-soft">COD surcharge</span>
              <span>{formatCurrency(order.codSurcharge.toString())}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-0.5 font-semibold">
              <span className="font-body text-ink">Total</span>
              <span>{formatCurrency(order.totalCharge.toString())}</span>
            </div>
          </div>
        </Field>
        <Field label="Customer">
          <p className="text-sm text-ink">{order.customer.name}</p>
          <p className="text-sm text-ink-soft">{order.customer.email}</p>
        </Field>
        <Field label="Delivery agent">
          {order.assignedAgent ? (
            <>
              <p className="text-sm text-ink">{order.assignedAgent.user.name}</p>
              <p className="text-sm text-ink-soft">{order.assignedAgent.user.email}</p>
            </>
          ) : (
            <p className="text-sm text-ink-soft">Not yet assigned</p>
          )}
        </Field>
        {order.rescheduleDate && (
          <Field label="Rescheduled for">
            <p className="font-manifest text-sm text-ink">
              {new Date(order.rescheduleDate).toDateString()}
            </p>
          </Field>
        )}
        {order.lastFailureNote && (
          <Field label="Last failure reason">
            <p className="text-sm text-manifest">{order.lastFailureNote}</p>
          </Field>
        )}
      </CardContent>
    </Card>
  );
}
