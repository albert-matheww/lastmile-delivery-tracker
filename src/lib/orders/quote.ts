import { prisma } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { resolveZoneForPincode } from "./zone-detection";
import { calculateCharge, zoneRelationFor, type ChargeBreakdown } from "./rate-engine";
import type { OrderType, PaymentType, ZoneRelation } from "@/generated/prisma/client";

export type QuoteInput = {
  pickupPincode: string;
  dropPincode: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  orderType: OrderType;
  paymentType: PaymentType;
};

export type Quote = ChargeBreakdown & {
  pickupZoneId: string;
  dropZoneId: string;
  zoneRelation: ZoneRelation;
};

/**
 * DB-loading orchestrator around the pure rate engine: resolves zones,
 * loads the matching admin-configured RateCard and CodSurchargeConfig,
 * then delegates the actual math to calculateCharge(). This is what
 * order creation calls to show the charge before the customer confirms.
 */
export async function buildQuote(input: QuoteInput): Promise<Quote> {
  const [pickupZone, dropZone] = await Promise.all([
    resolveZoneForPincode(input.pickupPincode),
    resolveZoneForPincode(input.dropPincode),
  ]);

  const zoneRelation = zoneRelationFor(pickupZone.id, dropZone.id);

  const rateCard = await prisma.rateCard.findUnique({
    where: {
      orderType_zoneRelation: { orderType: input.orderType, zoneRelation },
    },
  });
  if (!rateCard) {
    throw new AppError(
      `No rate card configured for ${input.orderType} ${zoneRelation.toLowerCase()}-zone deliveries. Ask an admin to configure one.`,
      422
    );
  }

  const codConfig =
    input.paymentType === "COD"
      ? await prisma.codSurchargeConfig.findUnique({
          where: { orderType: input.orderType },
        })
      : null;

  const breakdown = calculateCharge({
    lengthCm: input.lengthCm,
    breadthCm: input.breadthCm,
    heightCm: input.heightCm,
    actualWeightKg: input.actualWeightKg,
    paymentType: input.paymentType,
    rateCard,
    codConfig,
  });

  return {
    ...breakdown,
    pickupZoneId: pickupZone.id,
    dropZoneId: dropZone.id,
    zoneRelation,
  };
}
