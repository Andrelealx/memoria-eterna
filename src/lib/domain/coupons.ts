import type { CouponType } from "./enums";

// Regras de cupom (seções 4, 14, 23). Elegibilidade é decidida no servidor; o
// cálculo do desconto fica em pricing.ts.

export interface CouponLike {
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  validFrom?: Date | null;
  validUntil?: Date | null;
  totalLimit?: number | null;
  perCustomerLimit?: number | null;
  eligiblePlanSlugs: string[];
}

export interface CouponContext {
  now: Date;
  planSlug: string;
  totalRedeemed: number;
  customerRedeemed: number;
}

export interface CouponCheck {
  ok: boolean;
  reason?: string;
}

/** Normaliza o código (uppercase, sem espaços). */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function isCouponEligible(coupon: CouponLike, ctx: CouponContext): CouponCheck {
  if (!coupon.active) return { ok: false, reason: "Cupom inativo." };
  if (coupon.validFrom && coupon.validFrom.getTime() > ctx.now.getTime()) {
    return { ok: false, reason: "Cupom ainda não válido." };
  }
  if (coupon.validUntil && coupon.validUntil.getTime() < ctx.now.getTime()) {
    return { ok: false, reason: "Cupom expirado." };
  }
  if (coupon.totalLimit != null && ctx.totalRedeemed >= coupon.totalLimit) {
    return { ok: false, reason: "Limite de uso atingido." };
  }
  if (coupon.perCustomerLimit != null && ctx.customerRedeemed >= coupon.perCustomerLimit) {
    return { ok: false, reason: "Limite de uso por cliente atingido." };
  }
  if (!coupon.eligiblePlanSlugs.includes(ctx.planSlug)) {
    return { ok: false, reason: "Cupom não aplicável a este plano." };
  }
  return { ok: true };
}
