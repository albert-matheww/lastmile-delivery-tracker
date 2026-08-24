import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { codSurchargeSchema } from "@/lib/validation/schemas";

export const GET = withApiErrors(async () => {
  await requireRole("ADMIN");
  const configs = await prisma.codSurchargeConfig.findMany({
    orderBy: { orderType: "asc" },
  });
  return NextResponse.json({ configs });
});

export const POST = withApiErrors(async (req: Request) => {
  await requireRole("ADMIN");
  const body = codSurchargeSchema.parse(await req.json());

  const config = await prisma.codSurchargeConfig.upsert({
    where: { orderType: body.orderType },
    create: body,
    update: { flatFee: body.flatFee, percentOfCharge: body.percentOfCharge },
  });

  return NextResponse.json({ config }, { status: 201 });
});
