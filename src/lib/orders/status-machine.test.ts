import { describe, expect, it } from "vitest";
import { assertValidTransition, isValidTransition } from "./status-machine";

describe("isValidTransition", () => {
  it("allows the documented forward path", () => {
    expect(isValidTransition("CREATED", "ASSIGNED")).toBe(true);
    expect(isValidTransition("ASSIGNED", "PICKED_UP")).toBe(true);
    expect(isValidTransition("PICKED_UP", "IN_TRANSIT")).toBe(true);
    expect(isValidTransition("IN_TRANSIT", "OUT_FOR_DELIVERY")).toBe(true);
    expect(isValidTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
    expect(isValidTransition("OUT_FOR_DELIVERY", "FAILED")).toBe(true);
    expect(isValidTransition("FAILED", "RESCHEDULED")).toBe(true);
    expect(isValidTransition("RESCHEDULED", "OUT_FOR_DELIVERY")).toBe(true);
  });

  it("rejects skipping steps", () => {
    expect(isValidTransition("CREATED", "PICKED_UP")).toBe(false);
    expect(isValidTransition("ASSIGNED", "DELIVERED")).toBe(false);
  });

  it("rejects moving out of a terminal DELIVERED state", () => {
    expect(isValidTransition("DELIVERED", "FAILED")).toBe(false);
    expect(isValidTransition("DELIVERED", "OUT_FOR_DELIVERY")).toBe(false);
  });

  it("rejects going backwards", () => {
    expect(isValidTransition("IN_TRANSIT", "PICKED_UP")).toBe(false);
  });
});

describe("assertValidTransition", () => {
  it("throws AppError with a 409 status on an invalid transition", () => {
    expect(() => assertValidTransition("CREATED", "DELIVERED")).toThrowError();
    try {
      assertValidTransition("CREATED", "DELIVERED");
    } catch (err) {
      expect((err as { status: number }).status).toBe(409);
    }
  });

  it("does not throw on a valid transition", () => {
    expect(() => assertValidTransition("CREATED", "ASSIGNED")).not.toThrow();
  });

  it("bypasses validation entirely when allowAny is set (admin override)", () => {
    expect(() =>
      assertValidTransition("DELIVERED", "CREATED", { allowAny: true })
    ).not.toThrow();
  });
});
