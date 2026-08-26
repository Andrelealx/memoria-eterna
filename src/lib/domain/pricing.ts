import type { CouponType } from "./enums";

// Motor de preços (seções 4, 14, 21, 23). Todo cálculo é feito no SERVIDOR.
// O frontend NUNCA envia o total — apenas o plano, cupom e opções de frete.

export interface PlanPricing {
  id: string;
  priceCents: number;
  includesPhysical: boolean;
}

export interface CouponPricing {
  type: CouponType;
  value: number; // FIXED: centavos; PERCENTAGE: inteiro 0..100
}

export interface PriceQuoteInput {
  plan: PlanPricing;
  coupon?: CouponPricing | null;
  shippingCents?: number;
  // Quando upgrade: o valor já pago a abater (em centavos).
  alreadyPaidCents?: number;
}

export interface PriceBreakdown {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}

/** Aplica desconto de cupom sobre o subtotal. Nunca resulta em valor negativo. */
export function calculateDiscount(subtotalCents: number, coupon: CouponPricing): number {
  if (subtotalCents <= 0) return 0;
  let discount = 0;
  if (coupon.type === "FIXED") {
    discount = Math.min(coupon.value, subtotalCents);
  } else {
    const pct = Math.max(0, Math.min(100, coupon.value));
    discount = Math.round((subtotalCents * pct) / 100);
    discount = Math.min(discount, subtotalCents);
  }
  return Math.max(0, discount);
}

/** Monta o resumo de preço a partir de insumos do servidor. */
export function buildPriceBreakdown(input: PriceQuoteInput): PriceBreakdown {
  const subtotalCents = Math.max(0, input.plan.priceCents);
  const discountCents = input.coupon ? calculateDiscount(subtotalCents, input.coupon) : 0;
  const shippingCents = Math.max(0, input.shippingCents ?? 0);
  let totalCents = subtotalCents - discountCents + shippingCents;

  // Upgrade: cobra a diferença, preservando o valor já pago (seção 21).
  if (input.alreadyPaidCents != null && input.alreadyPaidCents > 0) {
    totalCents = Math.max(0, totalCents - input.alreadyPaidCents);
  }

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: Math.max(0, totalCents),
  };
}

/** Diferença de upgrade entre dois planos (nunca negativa). */
export function upgradeDifference(fromCents: number, toCents: number): number {
  return Math.max(0, toCents - fromCents);
}

/** Garante que valores estejam em centavos inteiros e não negativos. */
export function toCents(value: number): number {
  return Math.max(0, Math.round(value));
}
