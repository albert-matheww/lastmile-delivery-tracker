import { describe, expect, it } from "vitest";
import {
  calculateCharge,
  computeChargeableWeightKg,
  computeVolumetricWeightKg,
  zoneRelationFor,
} from "./rate-engine";

describe("computeVolumetricWeightKg", () => {
  it("applies the L x B x H / 5000 formula", () => {
    expect(computeVolumetricWeightKg(20, 15, 10)).toBeCloseTo(0.6);
    expect(computeVolumetricWeightKg(50, 50, 50)).toBeCloseTo(25);
  });
});

describe("computeChargeableWeightKg", () => {
  it("bills on the higher of actual vs volumetric weight", () => {
    expect(computeChargeableWeightKg(1, 5)).toBe(5);
    expect(computeChargeableWeightKg(5, 1)).toBe(5);
    expect(computeChargeableWeightKg(3, 3)).toBe(3);
  });
});

describe("zoneRelationFor", () => {
  it("is INTRA when pickup and drop zones match", () => {
    expect(zoneRelationFor("zone-1", "zone-1")).toBe("INTRA");
  });
  it("is INTER when they differ", () => {
    expect(zoneRelationFor("zone-1", "zone-2")).toBe("INTER");
  });
});

describe("calculateCharge", () => {
  const rateCard = { baseFee: 30, perKgRate: 12 };

  it("charges base fee + per-kg on the chargeable weight, no COD surcharge for PREPAID", () => {
    const result = calculateCharge({
      lengthCm: 20,
      breadthCm: 15,
      heightCm: 10, // volumetric = 0.6kg
      actualWeightKg: 1.2, // actual wins
      paymentType: "PREPAID",
      rateCard,
      codConfig: { flatFee: 15, percentOfCharge: 0.02 },
    });

    expect(result.volumetricWeightKg).toBeCloseTo(0.6);
    expect(result.chargeableWeightKg).toBeCloseTo(1.2);
    expect(result.baseFee.toNumber()).toBe(30);
    expect(result.weightCharge.toNumber()).toBeCloseTo(14.4); // 1.2 * 12
    expect(result.codSurcharge.toNumber()).toBe(0);
    expect(result.totalCharge.toNumber()).toBeCloseTo(44.4);
  });

  it("adds flat + percent COD surcharge on top of base+weight when paymentType is COD", () => {
    const result = calculateCharge({
      lengthCm: 50,
      breadthCm: 50,
      heightCm: 50, // volumetric = 25kg
      actualWeightKg: 6, // volumetric wins
      paymentType: "COD",
      rateCard,
      codConfig: { flatFee: 15, percentOfCharge: 0.02 },
    });

    expect(result.chargeableWeightKg).toBeCloseTo(25);
    const preSurcharge = 30 + 25 * 12; // 330
    const expectedCod = 15 + 0.02 * preSurcharge; // 15 + 6.6 = 21.6
    expect(result.codSurcharge.toNumber()).toBeCloseTo(expectedCod);
    expect(result.totalCharge.toNumber()).toBeCloseTo(preSurcharge + expectedCod);
  });

  it("ignores codConfig when paymentType is PREPAID even if provided", () => {
    const result = calculateCharge({
      lengthCm: 10,
      breadthCm: 10,
      heightCm: 10,
      actualWeightKg: 1,
      paymentType: "PREPAID",
      rateCard,
      codConfig: { flatFee: 999, percentOfCharge: 0.5 },
    });
    expect(result.codSurcharge.toNumber()).toBe(0);
  });

  it("treats a null codConfig on a COD order as zero surcharge", () => {
    const result = calculateCharge({
      lengthCm: 10,
      breadthCm: 10,
      heightCm: 10,
      actualWeightKg: 1,
      paymentType: "COD",
      rateCard,
      codConfig: null,
    });
    expect(result.codSurcharge.toNumber()).toBe(0);
  });
});
