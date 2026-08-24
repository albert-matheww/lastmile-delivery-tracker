import { prisma } from "@/lib/db/client";
import { AuthError } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import type { SessionPayload } from "@/lib/auth/jwt";
import type { Prisma } from "@/generated/prisma/client";

const orderDetailInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  pickupZone: { select: { id: true, name: true } },
  dropZone: { select: { id: true, name: true } },
  assignedAgent: {
    select: { id: true, availability: true, user: { select: { name: true, email: true } } },
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
    include: { actor: { select: { name: true, role: true } } },
  },
} as const;

export type OrderWithDetail = Prisma.OrderGetPayload<{
  include: typeof orderDetailInclude;
}>;

/** Loads an order and enforces that CUSTOMER/AGENT can only see their own. */
export async function loadOrderForViewer(
  orderId: string,
  user: SessionPayload
): Promise<OrderWithDetail> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderDetailInclude,
  });
  if (!order) throw new NotFoundError("Order not found");

  if (user.role === "CUSTOMER" && order.customerId !== user.sub) {
    throw new AuthError("You do not have access to this order.", 403);
  }

  if (user.role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId: user.sub } });
    if (!agent || order.assignedAgentId !== agent.id) {
      throw new AuthError("You do not have access to this order.", 403);
    }
  }

  return order;
}
