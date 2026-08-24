import type { OrderStatus } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";

/**
 * Order status lifecycle.
 *
 *   CREATED -> ASSIGNED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
 *                                                            |
 *                                                            v
 *                                                          FAILED -> RESCHEDULED -> OUT_FOR_DELIVERY (loop)
 *
 * ASSIGNED is reached via the assignment flow (manual or auto-assign),
 * not a generic status update. RESCHEDULED re-enters at OUT_FOR_DELIVERY
 * because the package is already picked up — only the delivery attempt
 * is retried, not the pickup. ADMIN may override to any status via the
 * `allowAny` escape hatch, per the spec's "override any order status".
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["ASSIGNED"],
  ASSIGNED: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  FAILED: ["RESCHEDULED"],
  RESCHEDULED: ["OUT_FOR_DELIVERY"],
  DELIVERED: [],
};

/** Statuses a delivery agent may set on their own assigned orders. */
export const AGENT_SETTABLE_STATUSES: OrderStatus[] = [
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
];

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertValidTransition(
  from: OrderStatus,
  to: OrderStatus,
  options: { allowAny?: boolean } = {}
): void {
  if (options.allowAny) return;
  if (!isValidTransition(from, to)) {
    throw new AppError(
      `Cannot move an order from ${from} to ${to}. Valid next states: ${
        ORDER_TRANSITIONS[from]?.join(", ") || "none (terminal state)"
      }.`,
      409
    );
  }
}
