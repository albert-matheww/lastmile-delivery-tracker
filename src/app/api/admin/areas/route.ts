import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { areaSchema } from "@/lib/validation/schemas";
import { AppError } from "@/lib/errors";

export const GET = withApiErrors(async () => {
  await requireRole("ADMIN");
  const areas = await prisma.area.findMany({
    orderBy: { pincode: "asc" },
    include: { zone: { select: { id: true, name: true, code: true } } },
  });
  return NextResponse.json({ areas });
});

export const POST = withApiErrors(async (req: Request) => {
  await requireRole("ADMIN");
  const body = areaSchema.parse(await req.json());

  const zone = await prisma.zone.findUnique({ where: { id: body.zoneId } });
  if (!zone) throw new AppError("Zone not found.", 404);

  const existing = await prisma.area.findUnique({ where: { pincode: body.pincode } });
  if (existing) throw new AppError("This pincode is already mapped to a zone.", 409);

  const area = await prisma.area.create({ data: body });
  return NextResponse.json({ area }, { status: 201 });
});
