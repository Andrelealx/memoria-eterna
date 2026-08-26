import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/labels";

export const metadata = { title: "Cupons" };

export default async function AdminCuponsPage() {
  const coupons = await prisma.coupon.findMany({ include: { plans: { include: { plan: true } } } });

  return (
    <div>
      <h1 className="font-serif text-3xl">Cupons</h1>
      {coupons.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nenhum cupom cadastrado.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {coupons.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-white px-5 py-4">
              <p className="font-mono text-lg">{c.code}</p>
              <p className="text-sm text-muted-foreground">
                {c.type === "FIXED" ? `R$ ${(c.value / 100).toFixed(2)}` : `${c.value}%`} · válido até{" "}
                {formatDate(c.validUntil)} · planos: {c.plans.map((p) => p.plan.name).join(", ") || "todos"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
