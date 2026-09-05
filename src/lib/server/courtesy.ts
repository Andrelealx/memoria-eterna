import { prisma } from "@/lib/db";
import { generateCouponCode } from "@/lib/domain/tokens";
import { getEmailProvider } from "@/lib/adapters/email/factory";

// Promoção "leve 2, pague 1" (seção 23-bis): quem compra qualquer presente
// ganha um cupom de 100% para um segundo presente, sempre no plano Momento —
// mantém o custo da promoção previsível independente do que a pessoa comprou.

const COURTESY_PREFIX = "CORTESIA";
const COURTESY_VALID_DAYS = 30;

/**
 * Emite o cupom de cortesia depois de uma compra aprovada e avisa por e-mail.
 * Nunca lança para quem chama — quem chama decide o que fazer com a falha.
 */
export async function issueCourtesyCoupon(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      order: {
        select: {
          customerId: true,
          checkoutEmail: true,
          couponRedemptions: { select: { coupon: { select: { code: true } } } },
        },
      },
    },
  });
  const order = payment?.order;
  if (!order || !order.customerId || !order.checkoutEmail) return;

  // Sem encadeamento: se este pedido já foi pago com um cupom de cortesia,
  // não gera outro — senão a promoção vira presente infinito.
  const usedCourtesy = order.couponRedemptions.some((r) =>
    r.coupon.code.startsWith(`${COURTESY_PREFIX}-`),
  );
  if (usedCourtesy) return;

  const momento = await prisma.plan.findUnique({
    where: { slug: "momento" },
    select: { id: true, active: true },
  });
  if (!momento || !momento.active) return;

  const code = `${COURTESY_PREFIX}-${generateCouponCode()}`;
  const validUntil = new Date(Date.now() + COURTESY_VALID_DAYS * 24 * 60 * 60 * 1000);

  await prisma.coupon.create({
    data: {
      code,
      type: "PERCENTAGE",
      value: 100,
      validUntil,
      perCustomerLimit: 1,
      totalLimit: 1,
      active: true,
      plans: { create: [{ planId: momento.id }] },
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await getEmailProvider().send({
    to: order.checkoutEmail,
    template: "courtesy-coupon",
    subject: "Você ganhou um presente de cortesia 🎁",
    data: {
      code,
      validUntil: validUntil.toISOString(),
      createUrl: `${base}/criar`,
    },
  });
}
