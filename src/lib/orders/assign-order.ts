import { prisma } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { assertValidTransition } from "./status-machine";
import { findBestAgentForZoneOrThrow } from "./assignment";
import { notifyCustomerOfStatusChange } from "@/lib/notifications/notify";
import type { Role } from "@/generated/prisma/client";

async function assignOrderToAgent(
  orderId: string,
  agentId: string,
  actor: { id: string; role: Role }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);
  assertValidTransition(order.currentStatus, "ASSIGNED", {
    allowAny: actor.role === "ADMIN",
  });

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new AppError("Agent not found", 404);
  if (agent.availability !== "AVAILABLE" && actor.role !== "ADMIN") {
    throw new AppError("This agent is not currently available.", 409);
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { assignedAgentId: agentId, currentStatus: "ASSIGNED" },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "ASSIGNED",
        actorId: actor.id,
        actorRole: actor.role,
        note: `Assigned to agent ${agent.id}`,
      },
    }),
  ]);

  await notifyCustomerOfStatusChange(orderId, "ASSIGNED");
}

/** Admin picks a specific agent. */
export async function manuallyAssignOrder(
  orderId: string,
  agentId: string,
  actor: { id: string; role: Role }
) {
  return assignOrderToAgent(orderId, agentId, actor);
}

/** Admin (or the create-order flow) triggers nearest-available-agent selection. */
export async function autoAssignOrder(
  orderId: string,
  actor: { id: string; role: Role }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);
  const agent = await findBestAgentForZoneOrThrow(order.dropZoneId);
  return assignOrderToAgent(orderId, agent.id, actor);
}
