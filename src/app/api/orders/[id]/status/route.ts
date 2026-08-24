import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { updateStatusSchema } from "@/lib/validation/schemas";
import { updateOrderStatus } from "@/lib/orders/update-status";
import { AGENT_SETTABLE_STATUSES } from "@/lib/orders/status-machine";
import { loadOrderForViewer } from "@/lib/orders/access";

export const PATCH = withApiErrors(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = updateStatusSchema.parse(await req.json());

    if (user.role === "CUSTOMER") {
      throw new AppError("Customers cannot change order status.", 403);
    }

    if (user.role === "AGENT") {
      if (!AGENT_SETTABLE_STATUSES.includes(body.status)) {
        throw new AppError(
          `Agents can only set status to one of: ${AGENT_SETTABLE_STATUSES.join(", ")}.`,
          403
        );
      }
      const agent = await prisma.agent.findUnique({ where: { userId: user.sub } });
      const order = await loadOrderForViewer(id, user); // enforces assigned-agent scoping
      if (!agent || order.assignedAgentId !== agent.id) {
        throw new AppError("You are not assigned to this order.", 403);
      }
    }

    await updateOrderStatus(
      id,
      body.status,
      { id: user.sub, role: user.role },
      { note: body.note, allowAny: user.role === "ADMIN" }
    );

    const order = await loadOrderForViewer(id, user);
    return NextResponse.json({ order });
  }
);
