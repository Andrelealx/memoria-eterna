import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { PlanToggle } from "@/components/admin/plan-toggle";

export const metadata = { title: "Planos" };

export default async function AdminPlanosPage() {
  const plans = await prisma.plan.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-serif text-3xl">Planos</h1>

      <ul className="mt-6 space-y-3">
        {plans.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4">
            <div>
              <p className="font-serif text-lg">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatBRL(p.priceCents)} · {p.durationDays ? `${p.durationDays} dias` : "sem expiração"}
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
