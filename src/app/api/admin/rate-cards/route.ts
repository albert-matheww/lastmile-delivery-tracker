import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { rateCardSchema } from "@/lib/validation/schemas";

export const GET = withApiErrors(async () => {
  await requireRole("ADMIN");
  const rateCards = await prisma.rateCard.findMany({
    orderBy: [{ orderType: "asc" }, { zoneRelation: "asc" }],
  });
  return NextResponse.json({ rateCards });
});

// Upsert — admins configure exactly one rate card per (orderType,
// zoneRelation) pair, so re-submitting the same pair updates it.
export const POST = withApiErrors(async (req: Request) => {
  await requireRole("ADMIN");
  const body = rateCardSchema.parse(await req.json());

  const rateCard = await prisma.rateCard.upsert({
    where: {
      orderType_zoneRelation: {
        orderType: body.orderType,
        zoneRelation: body.zoneRelation,
      },
    },
    create: body,
    update: { baseFee: body.baseFee, perKgRate: body.perKgRate },
  });

  return NextResponse.json({ rateCard }, { status: 201 });
});
