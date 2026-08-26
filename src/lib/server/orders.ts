import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateDiscount } from "@/lib/domain/pricing";
import { normalizeCouponCode, isCouponEligible } from "@/lib/domain/coupons";
import { generateIdempotencyKey, generateOrderNumber, generatePublicToken } from "@/lib/domain/tokens";
import { parseProjectContent } from "@/lib/domain/projects";
import { suggestUniqueSlug } from "@/lib/domain/slug";
import { getPaymentProvider } from "@/lib/adapters/payment";
import { getEmailProvider } from "@/lib/adapters/email/factory";
import type { PaymentMethod, PaymentStatus } from "@/lib/domain/enums";

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

export async function createOrderFromDraft(input: {
  draftToken: string;
  planSlug: string;
  email: string;
  name?: string;
  couponCode?: string;
}): Promise<CreateOrderResult> {
  const project = await prisma.project.findUnique({ where: { draftToken: input.draftToken } });
  if (!project) throw new Error("[order] Rascunho não encontrado.");
  if (project.status !== "DRAFT") throw new Error("[order] Este rascunho já não pode ser comprado.");

  const plan = await prisma.plan.findUnique({ where: { slug: input.planSlug } });
  if (!plan || !plan.active) throw new Error("[order] Plano inválido.");

  if (plan.includesPhysical) {
    throw new Error("[order] O produto físico (frete/endereço) será habilitado na Fase 4.");
  }

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
      { now: new Date(), planSlug: plan.slug, totalRedeemed, customerRedeemed: 0 },
    );
    if (!check.ok) throw new Error(`[order] ${check.reason}`);
    discountCents = calculateDiscount(plan.priceCents, { type: coupon.type, value: coupon.value });
    couponId = coupon.id;
  }

  const total = plan.priceCents - discountCents;
  const seq = (await prisma.order.count()) + 1;
  const orderNumber = generateOrderNumber(seq);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: project.ownerId,
        checkoutEmail: input.email.trim().toLowerCase(),
        projectId: project.id,
        currency: "BRL",
        subtotal: plan.priceCents,
        discount: discountCents,
        shipping: 0,
        total,
        status: "AWAITING_PAYMENT",
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
        data: { couponId, orderId: order.id, customerId: project.ownerId },
      });
    }

    await tx.project.update({
      where: { id: project.id },
      data: { status: "AWAITING_PAYMENT", planId: plan.id },
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
    shipping: 0,
    total,
  };
}

export interface InitiatePaymentResult {
  status: PaymentStatus;
  redirect: "sucesso" | "pendente" | "falha";
  pix?: { qrCode: string; qrCodeBase64: string; expiresAt: string };
  orderId: string;
}

export async function initiatePayment(
  paymentId: string,
  method: PaymentMethod,
  payerEmail: string,
  payerName?: string,
): Promise<InitiatePaymentResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment) throw new Error("[payment] Pagamento não encontrado.");

  const provider = getPaymentProvider();
  const result = await provider.createPayment({
    orderId: payment.orderId,
    amountCents: payment.amount,
    method,
    idempotencyKey: payment.idempotencyKey,
    payer: { email: payerEmail, name: payerName },
    description: `Presente ${payment.order.orderNumber}`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerPaymentId: result.providerPaymentId,
      method,
      status: result.status,
      sanitizedPayload: result.pix ? { pix: true } : { card: true },
    },
  });

  if (result.status === "APPROVED") {
    await processPaymentApproved(payment.id, `direct_${result.providerPaymentId}`);
    return { status: "APPROVED", redirect: "sucesso", orderId: payment.orderId };
  }
  if (result.status === "REJECTED") {
    return { status: "REJECTED", redirect: "falha", orderId: payment.orderId };
  }
  return {
    status: "PENDING",
    redirect: "pendente",
    pix: result.pix,
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

    // E-mail transacional (dev: log). Nunca bloqueia a publicação.
    try {
      await getEmailProvider().send({
        to: "",
        template: "payment-approved",
        subject: "Pagamento aprovado",
        data: {},
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
