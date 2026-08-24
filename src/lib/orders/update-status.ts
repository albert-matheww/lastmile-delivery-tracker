import { prisma } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { assertValidTransition } from "./status-machine";
import { notifyCustomerOfStatusChange } from "@/lib/notifications/notify";
import type { OrderStatus, Role } from "@/generated/prisma/client";

/**
 * Generic status transition used by agents progressing an order
 * (PICKED_UP / IN_TRANSIT / OUT_FOR_DELIVERY / DELIVERED / FAILED) and
 * by admin overrides. Every change is written to the immutable
 * OrderStatusHistory log with the acting user and a timestamp.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actor: { id: string; role: Role },
  options: { note?: string; allowAny?: boolean } = {}
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);

  assertValidTransition(order.currentStatus, newStatus, {
    allowAny: options.allowAny ?? actor.role === "ADMIN",
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        currentStatus: newStatus,
        lastFailureNote:
          newStatus === "FAILED" ? options.note ?? null : order.lastFailureNote,
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: newStatus,
        actorId: actor.id,
        actorRole: actor.role,
        note: options.note,
      },
    }),
  ]);

  await notifyCustomerOfStatusChange(orderId, newStatus, {
    failureNote: options.note,
  });
}
