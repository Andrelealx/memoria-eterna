import { describe, expect, it } from "vitest";
import {
  buildPriceBreakdown,
  calculateDiscount,
  toCents,
  upgradeDifference,
} from "./pricing";

describe("pricing", () => {
  it("aplica desconto fixo sem ultrapassar o subtotal", () => {
    expect(calculateDiscount(1990, { type: "FIXED", value: 500 })).toBe(500);
    expect(calculateDiscount(300, { type: "FIXED", value: 1000 })).toBe(300);
  });

  it("aplica desconto percentual", () => {
    expect(calculateDiscount(10000, { type: "PERCENTAGE", value: 10 })).toBe(1000);
    expect(calculateDiscount(10000, { type: "PERCENTAGE", value: 150 })).toBe(10000); // cap 100%
  });

  it("monta o resumo de preço com frete e cupom", () => {
    const result = buildPriceBreakdown({
      plan: { id: "p1", priceCents: 14990, includesPhysical: true },
      coupon: { type: "PERCENTAGE", value: 10 },
      shippingCents: 1990,
    });
    expect(result.subtotalCents).toBe(14990);
    expect(result.discountCents).toBe(1499);
    expect(result.shippingCents).toBe(1990);
    expect(result.totalCents).toBe(14990 - 1499 + 1990);
  });

  it("abate valor já pago no upgrade", () => {
    const result = buildPriceBreakdown({
      plan: { id: "p2", priceCents: 5990, includesPhysical: false },
      alreadyPaidCents: 1990,
    });
    expect(result.totalCents).toBe(4000);
  });

  it("calcula diferença de upgrade sem resultado negativo", () => {
    expect(upgradeDifference(1990, 5990)).toBe(4000);
    expect(upgradeDifference(5990, 1990)).toBe(0);
  });

  it("mantém centavos inteiros e não negativos", () => {
    expect(toCents(19.9)).toBe(20);
    expect(toCents(-5)).toBe(0);
  });
});
