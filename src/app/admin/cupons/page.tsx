import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { CouponCreate } from "@/components/admin/coupon-create";
import { CouponActions } from "@/components/admin/coupon-actions";

export const metadata = { title: "Cupons" };

export default async function AdminCuponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      plans: { include: { plan: true } },
      _count: { select: { redemptions: true } },
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Cupons</h1>

      <CouponCreate />

      {coupons.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nenhum cupom cadastrado.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {coupons.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-lg">{c.code}</p>
                  {!c.active && <Badge variant="muted">inativo</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.type === "FIXED" ? `R$ ${(c.value / 100).toFixed(2)}` : `${c.value}%`} · válido até{" "}
                  {formatDate(c.validUntil)} · planos: {c.plans.map((p) => p.plan.name).join(", ") || "todos"}
                </p>
              </div>
              <CouponActions couponId={c.id} active={c.active} canDelete={c._count.redemptions === 0} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
