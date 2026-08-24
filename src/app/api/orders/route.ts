import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { createOrderSchema } from "@/lib/validation/schemas";
import { createOrder } from "@/lib/orders/create-order";
import { AppError } from "@/lib/errors";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

const ORDER_STATUSES: OrderStatus[] = [
  "CREATED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RESCHEDULED",
];

export const GET = withApiErrors(async (req: Request) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);

  const where: Prisma.OrderWhereInput = {};

  const statusParam = searchParams.get("status");
  if (statusParam && ORDER_STATUSES.includes(statusParam as OrderStatus)) {
    where.currentStatus = statusParam as OrderStatus;
  }

  if (user.role === "CUSTOMER") {
    where.customerId = user.sub;
  } else if (user.role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId: user.sub } });
    where.assignedAgentId = agent?.id ?? "__none__";
  } else {
    // ADMIN: optional filters
    const zoneId = searchParams.get("zoneId");
    const agentId = searchParams.get("agentId");
    if (zoneId) {
      where.OR = [{ pickupZoneId: zoneId }, { dropZoneId: zoneId }];
    }
    if (agentId) {
      where.assignedAgentId = agentId;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      pickupZone: { select: { id: true, name: true } },
      dropZone: { select: { id: true, name: true } },
      assignedAgent: {
        select: { id: true, user: { select: { name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ orders });
});

export const POST = withApiErrors(async (req: Request) => {
  const user = await requireUser();
  const body = createOrderSchema.parse(await req.json());

  let customerId = user.sub;

  if (user.role === "ADMIN") {
    if (!body.customerEmail) {
      throw new AppError(
        "customerEmail is required when an admin creates an order on behalf of a customer.",
        422
      );
    }
    const customer = await prisma.user.findUnique({
      where: { email: body.customerEmail },
    });
    if (!customer || customer.role !== "CUSTOMER") {
      throw new AppError("No customer account found with that email.", 404);
    }
    customerId = customer.id;
  } else if (user.role !== "CUSTOMER") {
    throw new AppError("Only customers or admins can create orders.", 403);
  }

  const order = await createOrder(
    {
      ...body,
      customerId,
      createdByAdminId: user.role === "ADMIN" ? user.sub : null,
    },
    { id: user.sub, role: user.role }
  );

  return NextResponse.json({ order }, { status: 201 });
});
