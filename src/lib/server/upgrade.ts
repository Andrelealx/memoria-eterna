import { prisma } from "@/lib/db";
import { upgradeDifference } from "@/lib/domain/pricing";
import { generateIdempotencyKey, generateOrderNumber } from "@/lib/domain/tokens";

// Upgrade de plano (seções 4, 21). Preserva o mesmo link (slug/publicToken/NFC),
// recalcula limites/validade e nunca perde o conteúdo já enviado.

export interface UpgradeOrderResult {
  orderId: string;
  paymentId: string;
  diffCents: number;
}

export async function createUpgradeOrder(input: {
  projectId: string;
  newPlanSlug: string;
  email: string;
}): Promise<UpgradeOrderResult> {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    include: { plan: true },
  });
  if (!project) throw new Error("[upgrade] Presente não encontrado.");
  if (!project.plan) throw new Error("[upgrade] Plano atual desconhecido.");

  const newPlan = await prisma.plan.findUnique({ where: { slug: input.newPlanSlug } });
  if (!newPlan || !newPlan.active) throw new Error("[upgrade] Plano inválido.");
  if (newPlan.includesPhysical) throw new Error("[upgrade] Produto físico não disponível no upgrade.");

  const diffCents = upgradeDifference(project.plan.priceCents, newPlan.priceCents);

  const seq = (await prisma.order.count()) + 1;
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(seq),
      customerId: project.ownerId,
      checkoutEmail: input.email.trim().toLowerCase(),
      projectId: project.id,
      currency: "BRL",
      subtotal: diffCents,
      total: diffCents,
      status: "AWAITING_PAYMENT",
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      type: "UPGRADE",
      planId: newPlan.id,
      reference: newPlan.slug,
      description: `Upgrade para ${newPlan.name}`,
      quantity: 1,
      unitCents: diffCents,
      totalCents: diffCents,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "mercado_pago",
      idempotencyKey: generateIdempotencyKey(),
      method: "OTHER",
      status: "CREATED",
      amount: diffCents,
    },
  });

  return { orderId: order.id, paymentId: payment.id, diffCents };
}
