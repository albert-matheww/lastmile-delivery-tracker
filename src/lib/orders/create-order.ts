import { prisma } from "@/lib/db/client";
import { buildQuote, type QuoteInput } from "./quote";
import { generateOrderNumber } from "./order-number";
import { notifyCustomerOfStatusChange } from "@/lib/notifications/notify";
import type { Role } from "@/generated/prisma/client";

export type CreateOrderInput = QuoteInput & {
  pickupAddress: string;
  dropAddress: string;
  customerId: string;
  createdByAdminId?: string | null;
};

export async function createOrder(
  input: CreateOrderInput,
  actor: { id: string; role: Role }
) {
  const quote = await buildQuote(input);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: input.customerId,
        createdByAdminId: input.createdByAdminId ?? null,
        pickupAddress: input.pickupAddress,
        pickupPincode: input.pickupPincode,
        pickupZoneId: quote.pickupZoneId,
        dropAddress: input.dropAddress,
        dropPincode: input.dropPincode,
        dropZoneId: quote.dropZoneId,
        lengthCm: input.lengthCm,
        breadthCm: input.breadthCm,
        heightCm: input.heightCm,
        actualWeightKg: input.actualWeightKg,
        volumetricWeightKg: quote.volumetricWeightKg,
        chargeableWeightKg: quote.chargeableWeightKg,
        orderType: input.orderType,
        paymentType: input.paymentType,
        zoneRelation: quote.zoneRelation,
        baseFee: quote.baseFee,
        weightCharge: quote.weightCharge,
        codSurcharge: quote.codSurcharge,
        totalCharge: quote.totalCharge,
        currentStatus: "CREATED",
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: created.id,
        status: "CREATED",
        actorId: actor.id,
        actorRole: actor.role,
        note: input.createdByAdminId
          ? "Order created by admin on behalf of customer"
          : "Order created by customer",
      },
    });

    return created;
  });

  await notifyCustomerOfStatusChange(order.id, "CREATED");

  return order;
}
