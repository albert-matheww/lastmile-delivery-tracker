import { cn } from "@/lib/utils";
import type { OrderStatus, AgentAvailability } from "@/generated/prisma/client";

const STATUS_STYLES: Record<OrderStatus, string> = {
  CREATED: "bg-info-bg text-info",
  ASSIGNED: "bg-info-bg text-info",
  PICKED_UP: "bg-warning-bg text-warning",
  IN_TRANSIT: "bg-warning-bg text-warning",
  OUT_FOR_DELIVERY: "bg-warning-bg text-warning",
  DELIVERED: "bg-success-bg text-success",
  FAILED: "bg-danger-bg text-danger",
  RESCHEDULED: "bg-info-bg text-info",
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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const AVAILABILITY_STYLES: Record<AgentAvailability, string> = {
  AVAILABLE: "bg-success-bg text-success",
  BUSY: "bg-warning-bg text-warning",
  OFFLINE: "bg-border text-muted",
};

export function AvailabilityBadge({ availability }: { availability: AgentAvailability }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        AVAILABILITY_STYLES[availability]
      )}
    >
      {availability}
    </span>
  );
}
