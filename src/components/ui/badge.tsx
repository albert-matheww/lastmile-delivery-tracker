import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";

/*
  StatusBadge is the app's signature element: order status rendered as
  a rotated ink stamp rather than a soft pill. Every surface that shows
  a status (order cards, tables, detail headers) uses this same mark.
*/
const STATUS_STYLES: Record<OrderStatus, string> = {
  CREATED: "text-route bg-route-soft",
  ASSIGNED: "text-route bg-route-soft",
  PICKED_UP: "text-hold bg-hold-soft",
  IN_TRANSIT: "text-hold bg-hold-soft",
  OUT_FOR_DELIVERY: "text-hold bg-hold-soft",
  DELIVERED: "text-cleared bg-cleared-soft",
  FAILED: "text-manifest bg-manifest-soft",
  RESCHEDULED: "text-route bg-route-soft",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: "Created",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  RESCHEDULED: "Rescheduled",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("ink-stamp", STATUS_STYLES[status])}>{STATUS_LABELS[status]}</span>
  );
}
