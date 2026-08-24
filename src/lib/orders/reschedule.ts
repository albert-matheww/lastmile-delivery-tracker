import { prisma } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { assertValidTransition } from "./status-machine";
import { findBestAgentForZoneOrThrow } from "./assignment";
import { notifyCustomerOfStatusChange } from "@/lib/notifications/notify";
import type { Role } from "@/generated/prisma/client";

/**
 * Failed-delivery reschedule flow: customer (or admin) picks a new
 * date for a FAILED order. Per the spec, the agent is reassigned
 * automatically as part of this action — it does not wait for a
 * separate manual/auto-assign step.
 */
export async function rescheduleOrder(
  orderId: string,
  newDate: Date,
  actor: { id: string; role: Role }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);
  if (order.customerId !== actor.id && actor.role !== "ADMIN") {
    throw new AppError("You can only reschedule your own orders.", 403);
  }
  assertValidTransition(order.currentStatus, "RESCHEDULED", {
    allowAny: actor.role === "ADMIN",
  });
  if (newDate.getTime() < Date.now()) {
    throw new AppError("Reschedule date must be in the future.", 422);
  }

  const agent = await findBestAgentForZoneOrThrow(order.dropZoneId);

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        currentStatus: "RESCHEDULED",
        rescheduleDate: newDate,
        assignedAgentId: agent.id,
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "RESCHEDULED",
        actorId: actor.id,
        actorRole: actor.role,
        note: `Rescheduled for ${newDate.toDateString()}; reassigned to agent ${agent.id}`,
      },
    }),
  ]);

  await notifyCustomerOfStatusChange(orderId, "RESCHEDULED", {
    rescheduleDate: newDate,
  });
}
