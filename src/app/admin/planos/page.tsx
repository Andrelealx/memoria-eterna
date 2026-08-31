import { prisma } from "@/lib/db";
import { PlanToggle } from "@/components/admin/plan-toggle";
import { PlanPrice } from "@/components/admin/plan-price";
import { PlanName, PlanDuration } from "@/components/admin/plan-details";

export const metadata = { title: "Planos" };

export default async function AdminPlanosPage() {
  const plans = await prisma.plan.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-serif text-3xl">Planos</h1>

      <ul className="mt-6 space-y-3">
        {plans.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
            <div>
              <PlanName planId={p.id} name={p.name} />
              <p className="text-sm text-muted-foreground">
                <PlanPrice planId={p.id} priceCents={p.priceCents} /> ·{" "}
                <PlanDuration planId={p.id} durationDays={p.durationDays} />
                {p.includesPhysical ? " · inclui físico" : ""}
              </p>
            </div>
            <PlanToggle planId={p.id} active={p.active} />
          </li>
        ))}
      </ul>
    </div>
  );
}
