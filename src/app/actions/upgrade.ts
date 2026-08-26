"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessOwnedResource } from "@/lib/auth/authorize";
import { createUpgradeOrder } from "@/lib/server/upgrade";
import { initiatePayment } from "@/lib/server/orders";

// Upgrade de plano (seções 4, 21). Preserva o link. Em dev usa o provedor fake.

export async function startUpgrade(input: {
  projectId: string;
  newPlanSlug: string;
}): Promise<{ redirect: "sucesso" | "pendente" | "falha"; orderId: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("[upgrade] Acesso negado.");

  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!canAccessOwnedResource(user, project?.ownerId ?? null)) {
    throw new Error("[upgrade] Acesso negado.");
  }

  const { paymentId, orderId } = await createUpgradeOrder({
    projectId: input.projectId,
    newPlanSlug: input.newPlanSlug,
    email: user.email,
  });

  const result = await initiatePayment(paymentId, "CARD", user.email);
  return { redirect: result.redirect, orderId };
}
