import { timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { calculateDiscount } from "@/lib/domain/pricing";
import { normalizeCouponCode, isCouponEligible } from "@/lib/domain/coupons";
import {
  generateIdempotencyKey,
  generateOrderNumber,
  generatePublicToken,
  hashToken,
} from "@/lib/domain/tokens";
import { contentWithinLimits, parseProjectContent } from "@/lib/domain/projects";
import { isProjectStatusEditable, planLimitsFor } from "@/lib/domain/plans";
import { suggestUniqueSlug } from "@/lib/domain/slug";
import { getPaymentProvider } from "@/lib/adapters/payment";
import { getEmailProvider } from "@/lib/adapters/email/factory";
import type { PaymentMethod, PaymentStatus } from "@/lib/domain/enums";
import { createMagicLink } from "@/lib/auth/magic-link";
import { getShippingProvider } from "@/lib/adapters/shipping/factory";
import {
  isRecoverablePaymentFailure,
  shouldReopenDraftAfterPaymentFailure,
  type RecoverablePaymentFailure,
} from "@/lib/domain/payment-recovery";

// Regras de pedido e pagamento no SERVIDOR (seções 14, 21). O total é sempre
// recalculado aqui — nunca aceito do frontend.

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  idempotencyKey: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export interface CardPaymentDetails {
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  identificationNumber: string;
}

export interface ShippingAddress {
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function createOrderFromDraft(input: {
  draftToken: string;
  planSlug: string;
  email: string;
  name?: string;
  couponCode?: string;
  acceptedTerms: boolean;
  shippingAddress?: ShippingAddress;
}): Promise<CreateOrderResult> {
  const project = await prisma.project.findUnique({ where: { draftToken: input.draftToken } });
  if (!project) throw new Error("[order] Rascunho não encontrado.");
  if (project.status !== "DRAFT")
    throw new Error("[order] Este rascunho já não pode ser comprado.");

  const plan = await prisma.plan.findUnique({ where: { slug: input.planSlug } });
  if (!plan || !plan.active) throw new Error("[order] Plano inválido.");

  const content = parseProjectContent(project.content);
  if (!content.creatorName.trim() || !content.recipientName.trim() || !content.title.trim()) {
    throw new Error("[order] Complete os nomes e o título antes de pagar.");
  }
  const limits = planLimitsFor(plan.limits);
  const limitCheck = contentWithinLimits(content, limits);
  if (!limitCheck.ok) throw new Error(`[order] ${limitCheck.errors[0]}`);
  if (content.music && !limits.musicEmbed) {
    throw new Error("[order] O plano escolhido não inclui música.");
  }
  if (!input.acceptedTerms) {
    throw new Error("[order] Aceite os Termos e a Política de Privacidade.");
  }

  if (plan.includesPhysical && !input.shippingAddress) {
    throw new Error("[order] Preencha o endereço de entrega.");
  }

  const shippingQuote = await getShippingProvider().quote({
    cep: input.shippingAddress?.cep ?? "",
    physical: plan.includesPhysical,
  });

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { emailNormalized: normalizedEmail },
  });

  // Cupom (se informado)
  let discountCents = 0;
  let couponId: string | null = null;
  if (input.couponCode) {
    const code = normalizeCouponCode(input.couponCode);
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: { plans: { include: { plan: true } } },
    });
    if (!coupon) throw new Error("[order] Cupom inválido.");

    const eligible = coupon.plans.map((cp) => cp.plan.slug);
    const totalRedeemed = await prisma.couponRedemption.count({ where: { couponId: coupon.id } });
    const check = isCouponEligible(
      { ...coupon, eligiblePlanSlugs: eligible },
      {
        now: new Date(),
        planSlug: plan.slug,
        totalRedeemed,
        customerRedeemed: existingUser
          ? await prisma.couponRedemption.count({
              where: { couponId: coupon.id, customerId: existingUser.id },
            })
          : 0,
      },
    );
    if (!check.ok) throw new Error(`[order] ${check.reason}`);
    discountCents = calculateDiscount(plan.priceCents, { type: coupon.type, value: coupon.value });
    couponId = coupon.id;
  }

  const total = plan.priceCents - discountCents + shippingQuote.shippingCents;
  const seq = (await prisma.order.count()) + 1;
  const orderNumber = generateOrderNumber(seq);

  const result = await prisma.$transaction(async (tx) => {
    const consentAt = new Date();
    const customer = await tx.user.upsert({
      where: { emailNormalized: normalizedEmail },
      create: {
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        name: input.name?.trim() || null,
        role: "CUSTOMER",
        consents: { terms: true, privacy: true },
        consentTermsAt: consentAt,
        consentPrivacyAt: consentAt,
      },
      update: {
        name: input.name?.trim() || undefined,
        consents: { terms: true, privacy: true },
        consentTermsAt: consentAt,
        consentPrivacyAt: consentAt,
      },
    });

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        checkoutEmail: normalizedEmail,
        projectId: project.id,
        currency: "BRL",
        subtotal: plan.priceCents,
        discount: discountCents,
        shipping: shippingQuote.shippingCents,
        total,
        status: "AWAITING_PAYMENT",
        addressSnapshot: input.shippingAddress
          ? {
              recipient: input.shippingAddress.recipient,
              cep: input.shippingAddress.cep,
              street: input.shippingAddress.street,
              number: input.shippingAddress.number,
              complement: input.shippingAddress.complement ?? "",
              neighborhood: input.shippingAddress.neighborhood,
              city: input.shippingAddress.city,
              state: input.shippingAddress.state,
            }
          : undefined,
      },
    });

    await tx.orderItem.create({
      data: {
        orderId: order.id,
        type: "PLAN",
        planId: plan.id,
        reference: plan.slug,
        description: plan.name,
        quantity: 1,
        unitCents: plan.priceCents,
        totalCents: plan.priceCents,
      },
    });

    if (plan.includesPhysical) {
      await tx.physicalOrder.create({
        data: {
          orderId: order.id,
          status: "WAITING_PAYMENT",
          sku: "kit-coracao-nfc",
          carrier: shippingQuote.carrier,
          estimatedDays: shippingQuote.estimatedDays,
        },
      });
    }

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "mercado_pago",
        idempotencyKey: generateIdempotencyKey(),
        method: "OTHER",
        status: "CREATED",
        amount: total,
      },
    });

    if (couponId) {
      await tx.couponRedemption.create({
        data: { couponId, orderId: order.id, customerId: customer.id },
      });
    }

    await tx.project.update({
      where: { id: project.id },
      data: { status: "AWAITING_PAYMENT", planId: plan.id, ownerId: customer.id },
    });

    return { order, payment };
  });

  return {
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    paymentId: result.payment.id,
    idempotencyKey: result.payment.idempotencyKey,
    subtotal: plan.priceCents,
    discount: discountCents,
    shipping: shippingQuote.shippingCents,
    total,
  };
}

export interface InitiatePaymentResult {
  status: PaymentStatus;
  redirect: "sucesso" | "pendente" | "falha";
  pix?: { qrCode: string; qrCodeBase64: string; expiresAt: string };
  /** Checkout Pro: URL da página de pagamento hospedada pelo Mercado Pago. */
  redirectUrl?: string;
  orderId: string;
}

export interface FailedPaymentRecovery {
  draftToken: string;
  orderNumber: string;
}

export interface PendingPixData {
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}

export type PendingPaymentSnapshot =
  | { status: "pending"; pix: PendingPixData | null }
  | { status: "approved"; pix: null }
  | { status: "failed"; pix: null };

const pixDataSchema = z.object({
  qrCode: z.string().min(1).max(16_384),
  qrCodeBase64: z.string().max(1_000_000),
  expiresAt: z.string().datetime(),
});

const storedPaymentPayloadSchema = z.object({
  version: z.literal(1),
  type: z.literal("pix"),
  pix: pixDataSchema,
});

/** Lê o DTO de Pix salvo em `Payment.sanitizedPayload`, se houver um válido. */
export function readStoredPix(sanitizedPayload: unknown): PendingPixData | null {
  const parsed = storedPaymentPayloadSchema.safeParse(sanitizedPayload);
  return parsed.success ? parsed.data.pix : null;
}

function sameSecret(left: string, right: string): boolean {
  const leftHash = Buffer.from(hashToken(left), "hex");
  const rightHash = Buffer.from(hashToken(right), "hex");
  return timingSafeEqual(leftHash, rightHash);
}

// Throttle da consulta ao provedor, por pagamento. A tela de Pix pergunta a
// cada 4s; sem isso, cada comprador parado na página viraria uma consulta ao
// Mercado Pago a cada 4 segundos. O Map vive por instância — no pior caso
// consultamos um pouco mais que o intervalo, o que é inofensivo.
const lastRemoteCheck = new Map<string, number>();
const REMOTE_CHECK_INTERVAL_MS = 10_000;

function shouldAskProvider(providerPaymentId: string): boolean {
  const now = Date.now();
  const previous = lastRemoteCheck.get(providerPaymentId) ?? 0;
  if (now - previous < REMOTE_CHECK_INTERVAL_MS) return false;
  lastRemoteCheck.set(providerPaymentId, now);
  // Evita crescer sem limite em instâncias de vida longa.
  if (lastRemoteCheck.size > 500) {
    for (const [key, at] of lastRemoteCheck) {
      if (now - at > 10 * 60_000) lastRemoteCheck.delete(key);
    }
  }
  return true;
}

/**
 * Pergunta o status ao provedor e aplica o resultado, para pagamentos que ainda
 * constam como pendentes aqui.
 *
 * O webhook continua sendo o caminho principal, mas ele pode simplesmente não
 * chegar (queda de rede do provedor, redirect na URL de notificação, timeout).
 * Quando isso acontece sem esta rede de segurança, o pedido fica preso em
 * AWAITING_PAYMENT para sempre, mesmo com o dinheiro já pago — foi o que
 * aconteceu com o pedido PV-2026-000004.
 *
 * Retorna o status corrente depois da tentativa. Nunca lança: uma falha de
 * consulta não pode derrubar a tela do comprador.
 */
export async function reconcilePendingPayment(
  paymentId: string,
  options: { force?: boolean } = {},
): Promise<PaymentStatus> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, providerPaymentId: true },
  });
  if (!payment) return "PENDING";
  return reconcilePaymentRecord(payment, options);
}

/**
 * Mesma reconciliação, a partir de um registro já carregado. Evita uma segunda
 * consulta ao banco na tela de Pix, que roda a cada 4 segundos.
 */
async function reconcilePaymentRecord(
  payment: { id: string; status: PaymentStatus; providerPaymentId: string | null },
  options: { force?: boolean } = {},
): Promise<PaymentStatus> {
  if (payment.status !== "PENDING" && payment.status !== "CREATED") return payment.status;
  if (!payment.providerPaymentId) return payment.status;
  if (!options.force && !shouldAskProvider(payment.providerPaymentId)) return payment.status;

  let remoteStatus: PaymentStatus;
  try {
    remoteStatus = await getPaymentProvider().getPaymentStatus(payment.providerPaymentId);
  } catch (cause) {
    console.error("[payment] Falha ao reconsultar pagamento no provedor.", {
      paymentId: payment.id,
      cause: cause instanceof Error ? cause.message : String(cause),
    });
    return payment.status;
  }

  if (remoteStatus === "APPROVED") {
    // O ID do evento marca a origem: assim uma confirmação vinda daqui não
    // colide com a do webhook, e a idempotência de processPaymentApproved
    // impede que as duas publiquem o presente em dobro.
    await processPaymentApproved(payment.id, `reconcile:${payment.providerPaymentId}`);
    return "APPROVED";
  }
  if (isRecoverablePaymentFailure(remoteStatus)) {
    await processPaymentFailed(payment.id, remoteStatus);
    return remoteStatus;
  }
  return payment.status;
}

/**
 * Retorna somente o estado e os dados de exibição do Pix para quem possui o
 * token secreto do rascunho que originou o pedido. O UUID do pedido, sozinho,
 * não funciona como autorização.
 */
export async function getPendingPaymentSnapshot(
  orderId: string,
  draftToken: string,
): Promise<PendingPaymentSnapshot | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId) ||
    !/^[A-Za-z0-9_-]{20,128}$/.test(draftToken)
  ) {
    return null;
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      method: true,
      providerPaymentId: true,
      sanitizedPayload: true,
      order: { select: { project: { select: { draftToken: true } } } },
    },
  });
  const storedDraftToken = payment?.order.project?.draftToken;
  if (!payment || !storedDraftToken || !sameSecret(draftToken, storedDraftToken)) return null;

  // Só o banco local não basta: ele depende do webhook, que pode nunca chegar.
  // Enquanto o comprador estiver olhando a tela, perguntamos ao provedor.
  // Uma falha aqui nunca pode derrubar a tela — no pior caso segue "pendente".
  let status: PaymentStatus = payment.status;
  try {
    status = await reconcilePaymentRecord(payment);
  } catch (cause) {
    console.error("[payment] Reconciliação falhou na tela de pagamento.", {
      paymentId: payment.id,
      cause: cause instanceof Error ? cause.message : String(cause),
    });
  }

  if (status === "APPROVED") return { status: "approved", pix: null };
  if (["REJECTED", "CANCELLED", "REFUNDED", "CHARGEDBACK"].includes(status)) {
    return { status: "failed", pix: null };
  }

  if (payment.method !== "PIX") return { status: "pending", pix: null };
  const parsedPayload = storedPaymentPayloadSchema.safeParse(payment.sanitizedPayload);
  return { status: "pending", pix: parsedPayload.success ? parsedPayload.data.pix : null };
}

// Uma pessoa pode clicar "gerar novo Pix" várias vezes seguidas (dedo
// escorregou, achou que não funcionou). Sem isso, cada clique vira uma nova
// cobrança de verdade criada no Mercado Pago.
const lastRegenerateAt = new Map<string, number>();
const REGENERATE_COOLDOWN_MS = 20_000;

export interface RegeneratePixResult {
  status: "approved" | "pending" | "unavailable";
  pix?: PendingPixData;
}

/**
 * Gera uma nova cobrança Pix para um pedido que ainda está aguardando
 * pagamento — o código anterior pode ter expirado, ou a pessoa simplesmente
 * perdeu o Pix e não tinha como recuperá-lo (é o que aconteceu no pedido
 * PV-2026-000004: o comprador ficou sem opção nenhuma além de "esperar").
 *
 * Antes de criar uma cobrança nova, sempre reconsulta a mais recente no
 * provedor — se ela já tiver sido aprovada nesse meio-tempo, não faz sentido
 * (e seria arriscado) gerar outra.
 */
async function regeneratePendingPixPayment(orderId: string): Promise<RegeneratePixResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      total: true,
      checkoutEmail: true,
      customer: { select: { name: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, providerPaymentId: true },
      },
    },
  });
  if (!order) return { status: "unavailable" };
  if (order.status === "PAID") return { status: "approved" };
  if (order.status !== "CREATED" && order.status !== "AWAITING_PAYMENT") {
    return { status: "unavailable" };
  }

  const latest = order.payments[0];
  if (latest) {
    const reconciled = await reconcilePaymentRecord(latest, { force: true });
    if (reconciled === "APPROVED") return { status: "approved" };
  }

  const now = Date.now();
  const lastAttempt = lastRegenerateAt.get(orderId) ?? 0;
  if (now - lastAttempt < REGENERATE_COOLDOWN_MS) {
    throw new Error("[payment] Aguarde alguns segundos antes de gerar um novo Pix.");
  }
  lastRegenerateAt.set(orderId, now);

  if (!order.checkoutEmail) {
    throw new Error("[payment] Este pedido não tem um e-mail de cobrança válido.");
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "mercado_pago",
      idempotencyKey: generateIdempotencyKey(),
      method: "OTHER",
      status: "CREATED",
      amount: order.total,
    },
  });

  const result = await initiatePayment(
    payment.id,
    "PIX",
    order.checkoutEmail,
    order.customer?.name ?? undefined,
  );

  if (result.status === "APPROVED") return { status: "approved" };
  if (result.pix) return { status: "pending", pix: result.pix };
  return { status: "unavailable" };
}

/**
 * Versão para quem está no fluxo anônimo de checkout (token do rascunho em
 * cookie HttpOnly) — a mesma prova de acesso usada por getPendingPaymentSnapshot.
 */
export async function regeneratePixWithDraftToken(
  orderId: string,
  draftToken: string,
): Promise<RegeneratePixResult | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId) ||
    !/^[A-Za-z0-9_-]{20,128}$/.test(draftToken)
  ) {
    return null;
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { project: { select: { draftToken: true } } },
  });
  const storedDraftToken = order?.project?.draftToken;
  if (!storedDraftToken || !sameSecret(draftToken, storedDraftToken)) return null;
  return regeneratePendingPixPayment(orderId);
}

/**
 * Versão para quem está autenticado em /painel — dispensa o cookie do
 * checkout, então funciona em qualquer aparelho onde a pessoa faça login,
 * não só naquele em que o Pix foi gerado originalmente.
 */
export async function regeneratePixForCustomer(
  orderId: string,
  customerId: string,
): Promise<RegeneratePixResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerId: true },
  });
  if (!order || order.customerId !== customerId) {
    throw new Error("[payment] Pedido não encontrado.");
  }
  return regeneratePendingPixPayment(orderId);
}

/**
 * Encerra uma tentativa sem cobrança e devolve o projeto ao estado editável.
 * A checagem de outro pedido ativo evita que um webhook atrasado interrompa
 * uma nova tentativa de pagamento feita para o mesmo presente.
 */
export async function processPaymentFailed(
  paymentId: string,
  status: RecoverablePaymentFailure,
): Promise<{ ok: boolean; reopened: boolean }> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { project: true } } },
    });
    if (!payment) throw new Error("[payment] Pagamento não encontrado.");

    // Uma confirmação prevalece sobre eventos terminais atrasados do provedor.
    if (
      ["APPROVED", "REFUNDED", "CHARGEDBACK"].includes(payment.status) ||
      ["PAID", "REFUNDED", "CHARGEDBACK"].includes(payment.order.status)
    ) {
      return { ok: true, reopened: false };
    }

    await tx.payment.update({ where: { id: payment.id }, data: { status } });
    await tx.order.updateMany({
      where: { id: payment.orderId, status: { in: ["CREATED", "AWAITING_PAYMENT"] } },
      data: { status: "CANCELLED" },
    });
    await tx.physicalOrder.updateMany({
      where: { orderId: payment.orderId, status: "WAITING_PAYMENT" },
      data: { status: "CANCELLED" },
    });
    await tx.couponRedemption.deleteMany({ where: { orderId: payment.orderId } });

    const project = payment.order.project;
    if (!project) return { ok: true, reopened: false };

    const anotherActiveOrder = await tx.order.findFirst({
      where: {
        projectId: project.id,
        id: { not: payment.orderId },
        status: { in: ["AWAITING_PAYMENT", "PAID"] },
      },
      select: { id: true },
    });
    const shouldReopen = shouldReopenDraftAfterPaymentFailure({
      paymentStatus: status,
      orderStatus: payment.order.status,
      projectStatus: project.status,
      hasAnotherActiveOrder: Boolean(anotherActiveOrder),
    });
    if (!shouldReopen) return { ok: true, reopened: false };

    const updated = await tx.project.updateMany({
      where: { id: project.id, status: "AWAITING_PAYMENT" },
      data: { status: "DRAFT" },
    });
    return { ok: true, reopened: updated.count === 1 };
  });
}

/** Retorna o acesso ao rascunho somente para uma tentativa já encerrada. */
export async function getFailedPaymentRecovery(
  orderId: string,
): Promise<FailedPaymentRecovery | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    return null;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      status: true,
      project: { select: { draftToken: true, status: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
  });
  const paymentStatus = order?.payments[0]?.status;
  if (
    !order?.project ||
    order.status !== "CANCELLED" ||
    order.project.status !== "DRAFT" ||
    !paymentStatus ||
    !isRecoverablePaymentFailure(paymentStatus)
  ) {
    return null;
  }

  return { draftToken: order.project.draftToken, orderNumber: order.orderNumber };
}

export async function initiatePayment(
  paymentId: string,
  method: PaymentMethod,
  payerEmail: string,
  payerName?: string,
  card?: CardPaymentDetails,
): Promise<InitiatePaymentResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment) throw new Error("[payment] Pagamento não encontrado.");
  if (method === "CARD" && !card) {
    throw new Error("[payment] Dados do cartão ausentes.");
  }

  const provider = getPaymentProvider();
  const result = await provider.createPayment({
    orderId: payment.orderId,
    amountCents: payment.amount,
    method,
    idempotencyKey: payment.idempotencyKey,
    payer: {
      email: payerEmail,
      name: payerName,
      identificationType: card ? "CPF" : undefined,
      identificationNumber: card?.identificationNumber,
    },
    description: `Presente ${payment.order.orderNumber}`,
    card: card
      ? {
          token: card.token,
          installments: card.installments,
          paymentMethodId: card.paymentMethodId,
          issuerId: card.issuerId,
        }
      : undefined,
  });

  // Persiste apenas o DTO normalizado necessário para reexibir a cobrança.
  // Não armazenamos a resposta bruta do provedor nem dados do pagador.
  const pix = result.pix ? pixDataSchema.parse(result.pix) : undefined;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerPaymentId: result.providerPaymentId,
      method,
      status: result.status,
      sanitizedPayload: pix
        ? { version: 1, type: "pix", pix }
        : method === "CHECKOUT_PRO"
          ? { version: 1, type: "checkout_pro" }
          : { version: 1, type: "card" },
    },
  });

  if (result.status === "APPROVED") {
    await processPaymentApproved(payment.id, `direct_${result.providerPaymentId}`);
    return { status: "APPROVED", redirect: "sucesso", orderId: payment.orderId };
  }
  if (isRecoverablePaymentFailure(result.status)) {
    await processPaymentFailed(payment.id, result.status);
    return { status: result.status, redirect: "falha", orderId: payment.orderId };
  }
  return {
    status: "PENDING",
    redirect: "pendente",
    pix,
    redirectUrl: result.redirectUrl,
    orderId: payment.orderId,
  };
}

/** Marca o pagamento como aprovado e publica o presente (idempotente). */
export async function processPaymentApproved(
  paymentId: string,
  providerEventId: string,
): Promise<{ ok: boolean; duplicate: boolean }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Idempotência: evento único; se já processado, o create falha (P2002).
      await tx.paymentEvent.create({
        data: {
          paymentId,
          providerEventId,
          type: "payment.approved",
          processedAt: new Date(),
          result: "processed",
        },
      });

      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: { order: { include: { project: true, items: { include: { plan: true } } } } },
      });

      if (payment.status !== "APPROVED") {
        await tx.payment.update({ where: { id: paymentId }, data: { status: "APPROVED" } });
      }
      await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
      await tx.physicalOrder.updateMany({
        where: { orderId: payment.orderId, status: "WAITING_PAYMENT" },
        data: { status: "QUEUED" },
      });

      // Publica o projeto (AWAITING_PAYMENT -> PUBLISHED), preservando conteúdo.
      const project = payment.order.project;
      if (project && project.status === "AWAITING_PAYMENT") {
        const plan = payment.order.items.find((i) => i.plan)?.plan;
        const expiresAt = plan?.durationDays
          ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
          : null;

        let slug = project.slug;
        if (!slug) {
          const parsed = parseProjectContent(project.content);
          const rows = await tx.project.findMany({
            where: { slug: { not: null } },
            select: { slug: true },
          });
          slug = suggestUniqueSlug(
            `${parsed.creatorName} ${parsed.recipientName}`,
            new Set(rows.map((r) => r.slug as string)),
          );
        }

        await tx.project.update({
          where: { id: project.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            expiresAt,
            slug,
            publicToken: project.publicToken ?? generatePublicToken(),
          },
        });
      }

      // Upgrade: atualiza plano/validade preservando link (slug/publicToken/NFC).
      const upgradeItem = payment.order.items.find((i) => i.type === "UPGRADE" && i.plan);
      if (upgradeItem?.plan && project) {
        const expiresAt = upgradeItem.plan.durationDays
          ? new Date(Date.now() + upgradeItem.plan.durationDays * 24 * 60 * 60 * 1000)
          : null;
        const status = project.status === "EXPIRED" ? "PUBLISHED" : project.status;
        await tx.project.update({
          where: { id: project.id },
          data: { planId: upgradeItem.plan.id, expiresAt, status },
        });
      }
    });

    // E-mail transacional com acesso ao presente. Nunca bloqueia a publicação.
    try {
      const paid = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: { include: { project: { include: { plan: true } } } } },
      });
      const customerId = paid?.order.customerId;
      const to = paid?.order.checkoutEmail;
      if (!customerId || !to) throw new Error("Pagamento sem cliente vinculado.");
      const rawToken = await createMagicLink(customerId);
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const project = paid.order.project;
      // Leva direto para a tela do presente (com o botão Editar quando o
      // plano permite), em vez de largar a pessoa no painel genérico.
      const next = project ? `/painel/presentes/${project.id}` : "/painel";
      const editable = project ? isProjectStatusEditable("PUBLISHED", project.plan?.limits) : false;
      const emailData: Record<string, string> = {
        orderNumber: paid.order.orderNumber,
        accessUrl: `${base}/entrar/${rawToken}?next=${encodeURIComponent(next)}`,
        accessLabel: editable ? "Acessar e editar" : "Acessar meu presente",
      };
      if (project?.slug) {
        emailData.giftUrl = `${base}/presente/${project.slug}`;
      }
      await getEmailProvider().send({
        to,
        template: "payment-approved",
        subject: "Pagamento aprovado",
        data: emailData,
      });
    } catch {
      // log apenas
    }

    return { ok: true, duplicate: false };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: true, duplicate: true };
    }
    throw e;
  }
}
