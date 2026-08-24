import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { zoneSchema } from "@/lib/validation/schemas";
import { AppError } from "@/lib/errors";

export const GET = withApiErrors(async () => {
  await requireRole("ADMIN");
  const zones = await prisma.zone.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { areas: true, agents: true } } },
  });
  return NextResponse.json({ zones });
});

export const POST = withApiErrors(async (req: Request) => {
  await requireRole("ADMIN");
  const body = zoneSchema.parse(await req.json());

  const existing = await prisma.zone.findFirst({
    where: { OR: [{ name: body.name }, { code: body.code }] },
  });
  if (existing) throw new AppError("A zone with this name or code already exists.", 409);

  const zone = await prisma.zone.create({ data: body });
  return NextResponse.json({ zone }, { status: 201 });
});
