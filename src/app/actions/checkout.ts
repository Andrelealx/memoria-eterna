"use server";

import { prisma } from "@/lib/db";
import { createOrderFromDraft, initiatePayment, processPaymentApproved } from "@/lib/server/orders";
import type { PaymentMethod } from "@/lib/domain/enums";

// Server actions do checkout (seção 14). O total é recalculado no servidor.

export interface StartCheckoutResult {
  redirect: "sucesso" | "pendente" | "falha";
  orderId: string;
  pix?: { qrCode: string; qrCodeBase64: string; expiresAt: string };
}

export async function startCheckout(input: {
  draftToken: string;
  planSlug: string;
  email: string;
  name?: string;
  method: PaymentMethod;
  couponCode?: string;
}): Promise<StartCheckoutResult> {
  const { paymentId } = await createOrderFromDraft({
    draftToken: input.draftToken,
    planSlug: input.planSlug,
    email: input.email,
    name: input.name,
    couponCode: input.couponCode,
  });

  const result = await initiatePayment(paymentId, input.method, input.email, input.name);
  return { redirect: result.redirect, orderId: result.orderId, pix: result.pix };
}

/** Simula a aprovação de um pagamento pendente — SOMENTE desenvolvimento. */
export async function approveOrderPayment(orderId: string): Promise<{ ok: boolean }> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("[dev] Aprovação simulada não é permitida em produção.");
  }
  const payment = await prisma.payment.findFirst({ where: { orderId } });
  if (!payment) throw new Error("[dev] Pagamento não encontrado.");

  await processPaymentApproved(payment.id, `dev_${payment.id}_${Date.now()}`);
  return { ok: true };
}
