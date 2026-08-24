import type { OrderStatus } from "@/generated/prisma/client";

const STATUS_COPY: Record<OrderStatus, string> = {
  CREATED: "has been created and is awaiting agent assignment",
  ASSIGNED: "has been assigned to a delivery agent",
  PICKED_UP: "has been picked up by your delivery agent",
  IN_TRANSIT: "is now in transit",
  OUT_FOR_DELIVERY: "is out for delivery",
  DELIVERED: "has been delivered",
  FAILED: "delivery attempt failed",
  RESCHEDULED: "has been rescheduled for another delivery attempt",
};

export function statusEmail(
  orderNumber: string,
  status: OrderStatus,
  extra?: { rescheduleDate?: Date | null; failureNote?: string | null }
): { subject: string; body: string } {
  const summary = STATUS_COPY[status];
  const subject = `Order ${orderNumber}: ${summary}`;

  const lines = [`Your order ${orderNumber} ${summary}.`];
  if (status === "FAILED" && extra?.failureNote) {
    lines.push(`Reason: ${extra.failureNote}`);
    lines.push("You can reschedule the delivery from your dashboard.");
  }
  if (status === "RESCHEDULED" && extra?.rescheduleDate) {
    lines.push(`New delivery date: ${extra.rescheduleDate.toDateString()}.`);
  }
  lines.push("", "Track your order any time from the Last-Mile Delivery Tracker dashboard.");

  return { subject, body: lines.join("\n") };
}
