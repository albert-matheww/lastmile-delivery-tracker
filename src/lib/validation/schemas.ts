import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  phone: z.string().min(6).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const dimensionsAndWeight = {
  lengthCm: z.number().positive().max(1000),
  breadthCm: z.number().positive().max(1000),
  heightCm: z.number().positive().max(1000),
  actualWeightKg: z.number().positive().max(5000),
};

export const quoteSchema = z.object({
  pickupPincode: z.string().min(3).max(12),
  dropPincode: z.string().min(3).max(12),
  ...dimensionsAndWeight,
  orderType: z.enum(["B2B", "B2C"]),
  paymentType: z.enum(["PREPAID", "COD"]),
});

export const createOrderSchema = quoteSchema.extend({
  pickupAddress: z.string().min(5).max(500),
  dropAddress: z.string().min(5).max(500),
  // Only used by admins creating an order on behalf of a customer.
  customerEmail: z.string().email().optional(),
});

export const assignOrderSchema = z.union([
  z.object({ mode: z.literal("auto") }),
  z.object({ mode: z.literal("manual"), agentId: z.string().min(1) }),
]);

export const updateStatusSchema = z.object({
  status: z.enum([
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    // Admin-only overrides also allow moving back to earlier states.
    "CREATED",
    "ASSIGNED",
    "RESCHEDULED",
  ]),
  note: z.string().max(1000).optional(),
});

export const rescheduleSchema = z.object({
  newDate: z.coerce.date(),
});

export const zoneSchema = z.object({
  name: z.string().min(2).max(80),
  code: z.string().min(2).max(20),
});

export const areaSchema = z.object({
  pincode: z.string().min(3).max(12),
  label: z.string().min(2).max(120),
  zoneId: z.string().min(1),
});

export const rateCardSchema = z.object({
  orderType: z.enum(["B2B", "B2C"]),
  zoneRelation: z.enum(["INTRA", "INTER"]),
  baseFee: z.number().nonnegative(),
  perKgRate: z.number().nonnegative(),
});

export const codSurchargeSchema = z.object({
  orderType: z.enum(["B2B", "B2C"]),
  flatFee: z.number().nonnegative(),
  percentOfCharge: z.number().min(0).max(1),
});

export const createAgentSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  zoneId: z.string().min(1),
});

export const updateAgentSchema = z.object({
  zoneId: z.string().min(1).optional(),
  availability: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
});
