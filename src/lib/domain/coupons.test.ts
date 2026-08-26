import { describe, expect, it } from "vitest";
import { isCouponEligible, normalizeCouponCode, type CouponLike } from "./coupons";

const base: CouponLike = {
  code: "AMOR10",
  type: "PERCENTAGE",
  value: 10,
  active: true,
  eligiblePlanSlugs: ["para-sempre"],
};

const ctx = { now: new Date("2026-01-01T00:00:00Z"), planSlug: "para-sempre", totalRedeemed: 0, customerRedeemed: 0 };

describe("coupons", () => {
  it("normaliza código", () => {
    expect(normalizeCouponCode("  amor 10 ")).toBe("AMOR10");
  });

  it("aceita cupom válido", () => {
    expect(isCouponEligible(base, ctx).ok).toBe(true);
  });

  it("rejeita cupom expirado", () => {
    const c = { ...base, validUntil: new Date("2025-12-31T00:00:00Z") };
    expect(isCouponEligible(c, ctx).ok).toBe(false);
  });

  it("rejeita plano não elegível", () => {
    expect(isCouponEligible(base, { ...ctx, planSlug: "momento" }).ok).toBe(false);
  });

  it("rejeita limite total atingido", () => {
    const c = { ...base, totalLimit: 10 };
    expect(isCouponEligible(c, { ...ctx, totalRedeemed: 10 }).ok).toBe(false);
  });
});
