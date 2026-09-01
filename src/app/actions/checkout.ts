"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  createOrderFromDraft,
  getPendingPaymentSnapshot,
  initiatePayment,
  processPaymentApproved,
  processPaymentFailed,
  type PendingPixData,
} from "@/lib/server/orders";
import type { PaymentMethod } from "@/lib/domain/enums";
import { z } from "zod";
import { getShippingProvider } from "@/lib/adapters/shipping/factory";
import { calculateDiscount } from "@/lib/domain/pricing";
import { isCouponEligible, normalizeCouponCode } from "@/lib/domain/coupons";
import { checkoutSchema, type CardPaymentInput, type ShippingAddressInput } from "@/lib/domain/checkout";

// Server actions do checkout (seção 14). O total é recalculado no servidor.

export interface StartCheckoutResult {
  redirect: "sucesso" | "pendente" | "falha";
  orderId: string;
  pix?: { qrCode: string; qrCodeBase64: string; expiresAt: string };
}

const orderIdSchema = z.string().uuid();
const PAYMENT_ACCESS_COOKIE_PREFIX = "pv_pix_";

function paymentAccessCookieName(orderId: string): string {
  return `${PAYMENT_ACCESS_COOKIE_PREFIX}${orderId}`;
}

async function setPaymentAccessCookie(orderId: string, draftToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(paymentAccessCookieName(orderId), draftToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/pagamento",
    maxAge: 24 * 60 * 60,
  });
}

async function clearPaymentAccessCookie(orderId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(paymentAccessCookieName(orderId), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/pagamento",
    maxAge: 0,
  });
}

async function readPaymentAccessToken(orderId: string): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(paymentAccessCookieName(orderId))?.value ?? null;
}

export async function quoteShipping(cep: string): Promise<{
  shippingCents: number;
  estimatedDays: number | null;
  carrier: string | null;
}> {
  const normalized = cep.replace(/\D/g, "");
  if (normalized.length !== 8) throw new Error("Digite um CEP válido com 8 números.");
  return getShippingProvider().quote({ cep: normalized, physical: true });
}

export async function quoteCoupon(input: {
  code: string;
  planSlug: string;
  email: string;
}): Promise<{ code: string; discountCents: number }> {
  const code = normalizeCouponCode(input.code);
  const email = z
    .string()
    .trim()
    .email("Digite seu e-mail antes de aplicar o cupom.")
    .parse(input.email);
  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { plans: { include: { plan: true } } },
  });
  if (!coupon) throw new Error("Cupom inválido.");
  const customer = await prisma.user.findUnique({
    where: { emailNormalized: email.toLowerCase() },
  });
  const [totalRedeemed, customerRedeemed] = await Promise.all([
    prisma.couponRedemption.count({ where: { couponId: coupon.id } }),
    customer
      ? prisma.couponRedemption.count({ where: { couponId: coupon.id, customerId: customer.id } })
      : Promise.resolve(0),
  ]);
  const check = isCouponEligible(
    { ...coupon, eligiblePlanSlugs: coupon.plans.map((item) => item.plan.slug) },
    { now: new Date(), planSlug: input.planSlug, totalRedeemed, customerRedeemed },
  );
  if (!check.ok) throw new Error(check.reason ?? "Cupom não aplicável.");
  const plan = coupon.plans.find((item) => item.plan.slug === input.planSlug)?.plan;
  if (!plan) throw new Error("Cupom não aplicável a este plano.");
  return { code, discountCents: calculateDiscount(plan.priceCents, coupon) };
}

export async function startCheckout(input: {
  draftToken: string;
  planSlug: string;
  email: string;
  name?: string;
  method: PaymentMethod;
  card?: CardPaymentInput;
  couponCode?: string;
  acceptedTerms: boolean;
  shippingAddress?: ShippingAddressInput;
}): Promise<StartCheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Revise os dados da compra.");
  }

  const { paymentId } = await createOrderFromDraft({
    draftToken: parsed.data.draftToken,
    planSlug: parsed.data.planSlug,
    email: parsed.data.email,
    name: parsed.data.name,
    couponCode: parsed.data.couponCode,
    acceptedTerms: parsed.data.acceptedTerms,
    shippingAddress: parsed.data.shippingAddress,
  });

  let result: Awaited<ReturnType<typeof initiatePayment>>;
  try {
    result = await initiatePayment(
      paymentId,
      parsed.data.method,
      parsed.data.email,
      parsed.data.name,
      parsed.data.card,
    );
  } catch (error) {
    // Se o provedor falhar antes de criar a cobrança, devolve o projeto ao rascunho
    // para que a pessoa possa tentar novamente sem perder o trabalho.
    await processPaymentFailed(paymentId, "CANCELLED");
    throw error;
  }

  // Uma falha ao gravar o cookie não pode cancelar no banco uma cobrança que
  // o provedor já criou. Nesse caso, o pagamento segue válido e o e-mail ainda
  // é o canal de recuperação.
  if (result.redirect === "pendente") {
    try {
      await setPaymentAccessCookie(result.orderId, parsed.data.draftToken);
    } catch {
      // O retorno ainda entrega o Pix para a aba atual; não criamos uma segunda
      // cobrança nem reabrimos o rascunho depois de o provedor aceitar a primeira.
    }
  }
  return { redirect: result.redirect, orderId: result.orderId, pix: result.pix };
}

/** Simula a aprovação de um pagamento pendente — SOMENTE desenvolvimento. */
export async function approveOrderPayment(orderId: string): Promise<{ ok: boolean }> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("[dev] Aprovação simulada não é permitida em produção.");
  }
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) throw new Error("[dev] Pagamento não encontrado.");
  const draftToken = await readPaymentAccessToken(parsed.data);
  const access = draftToken ? await getPendingPaymentSnapshot(parsed.data, draftToken) : null;
  if (!access || access.status !== "pending") {
    throw new Error("[dev] Acesso ao pagamento não autorizado.");
  }

  const payment = await prisma.payment.findFirst({ where: { orderId: parsed.data } });
  if (!payment) throw new Error("[dev] Pagamento não encontrado.");

  await processPaymentApproved(payment.id, `dev_${payment.id}_${Date.now()}`);
  await clearPaymentAccessCookie(parsed.data);
  return { ok: true };
}

export async function getOrderPaymentStatus(
  orderId: string,
  includePix = false,
): Promise<{
  status: "pending" | "approved" | "failed" | "unavailable";
  pix: PendingPixData | null;
}> {
  const shouldIncludePix = includePix === true;
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) return { status: "unavailable", pix: null };

  const draftToken = await readPaymentAccessToken(parsed.data);
  if (!draftToken) return { status: "unavailable", pix: null };

  const snapshot = await getPendingPaymentSnapshot(parsed.data, draftToken);
  if (!snapshot) return { status: "unavailable", pix: null };
  if (snapshot.status !== "pending") {
    await clearPaymentAccessCookie(parsed.data);
  }
  return snapshot.status === "pending" && !shouldIncludePix
    ? { status: "pending", pix: null }
    : snapshot;
}
