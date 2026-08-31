import { prisma } from "@/lib/db";
import { planLimitsFor, type PlanDefinition } from "@/lib/domain/plans";

/** Catálogo comercial ativo. Esta é a única fonte de preço exibida ao cliente. */
export async function listActivePlans(): Promise<PlanDefinition[]> {
  const rows = await prisma.plan.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  return rows.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    priceCents: plan.priceCents,
    durationDays: plan.durationDays,
    includesPhysical: plan.includesPhysical,
    order: plan.order,
    limits: planLimitsFor(plan.limits),
  }));
}
