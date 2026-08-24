import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { createAgentSchema } from "@/lib/validation/schemas";
import { AppError } from "@/lib/errors";

export const GET = withApiErrors(async () => {
  await requireRole("ADMIN");
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      zone: { select: { id: true, name: true } },
      _count: {
        select: { assignedOrders: true },
      },
    },
  });
  return NextResponse.json({ agents });
});

// Admin provisions a new delivery-agent account in one step: creates the
// User (role=AGENT) and its Agent profile together.
export const POST = withApiErrors(async (req: Request) => {
  await requireRole("ADMIN");
  const body = createAgentSchema.parse(await req.json());

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new AppError("An account with this email already exists.", 409);

  const zone = await prisma.zone.findUnique({ where: { id: body.zoneId } });
  if (!zone) throw new AppError("Zone not found.", 404);

  const passwordHash = await hashPassword(body.password);

  const agent = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: body.name, email: body.email, passwordHash, role: "AGENT" },
    });
    return tx.agent.create({
      data: { userId: user.id, zoneId: body.zoneId },
      include: { user: { select: { id: true, name: true, email: true } }, zone: true },
    });
  });

  return NextResponse.json({ agent }, { status: 201 });
});
