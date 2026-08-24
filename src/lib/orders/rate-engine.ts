import { Prisma } from "@/generated/prisma/client";
import type { OrderType, PaymentType, ZoneRelation } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type Decimal = InstanceType<typeof Decimal>;

/**
 * Volumetric weight formula per the spec: L × B × H ÷ 5000 (cm, kg).
 * Pure and unit-tested in rate-engine.test.ts.
 */
export function computeVolumetricWeightKg(
  lengthCm: number,
  breadthCm: number,
  heightCm: number
): number {
  return (lengthCm * breadthCm * heightCm) / 5000;
}

/** Billed on the higher of actual vs volumetric weight. */
export function computeChargeableWeightKg(
  actualWeightKg: number,
  volumetricWeightKg: number
): number {
  return Math.max(actualWeightKg, volumetricWeightKg);
}

export type RateCardInput = {
  baseFee: Decimal | number | string;
  perKgRate: Decimal | number | string;
};

export type CodConfigInput = {
  flatFee: Decimal | number | string;
  percentOfCharge: Decimal | number | string;
} | null;

export type ChargeBreakdown = {
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  baseFee: Decimal;
  weightCharge: Decimal;
  codSurcharge: Decimal;
  totalCharge: Decimal;
};

/**
 * Pure charge calculation — no DB access. Callers are responsible for
 * loading the correct RateCard (by orderType + zoneRelation) and
 * CodSurchargeConfig (by orderType) first; see quote.ts for the
 * DB-loading orchestrator used by the order-creation flow.
 */
export function calculateCharge(params: {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  paymentType: PaymentType;
  rateCard: RateCardInput;
  codConfig: CodConfigInput;
}): ChargeBreakdown {
  const volumetricWeightKg = computeVolumetricWeightKg(
    params.lengthCm,
    params.breadthCm,
    params.heightCm
  );
  const chargeableWeightKg = computeChargeableWeightKg(
    params.actualWeightKg,
    volumetricWeightKg
  );

  const baseFee = new Decimal(params.rateCard.baseFee);
  const weightCharge = new Decimal(params.rateCard.perKgRate).times(
    chargeableWeightKg
  );
  const preSurchargeTotal = baseFee.plus(weightCharge);

  let codSurcharge = new Decimal(0);
  if (params.paymentType === "COD" && params.codConfig) {
    const flat = new Decimal(params.codConfig.flatFee);
    const percent = new Decimal(params.codConfig.percentOfCharge).times(
      preSurchargeTotal
    );
    codSurcharge = flat.plus(percent);
  }

  const totalCharge = preSurchargeTotal.plus(codSurcharge);

  return {
    volumetricWeightKg,
    chargeableWeightKg,
    baseFee,
    weightCharge,
    codSurcharge,
    totalCharge,
  };
}

export function zoneRelationFor(
  pickupZoneId: string,
  dropZoneId: string
): ZoneRelation {
  return pickupZoneId === dropZoneId ? "INTRA" : "INTER";
}

export type { OrderType, PaymentType, ZoneRelation };
