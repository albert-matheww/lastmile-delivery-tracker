import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { updateAgentSchema } from "@/lib/validation/schemas";
import { AppError } from "@/lib/errors";

export const PATCH = withApiErrors(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireRole("ADMIN");
    const { id } = await ctx.params;
    const body = updateAgentSchema.parse(await req.json());

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new AppError("Agent not found.", 404);

    const updated = await prisma.agent.update({
      where: { id },
      data: body,
      include: { user: { select: { name: true, email: true } }, zone: true },
    });

    return NextResponse.json({ agent: updated });
  }
);
