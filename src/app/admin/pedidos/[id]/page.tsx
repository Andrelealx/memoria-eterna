import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { PHYSICAL_ORDER_TRANSITIONS } from "@/lib/domain/state-machine";
import { PHYSICAL_ORDER_LABELS, formatDate } from "@/lib/labels";
import { PhysicalActions } from "@/components/admin/physical-actions";

export const metadata = { title: "Pedido" };

export default async function AdminPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { plan: true } }, payments: true, physicalOrder: { include: { nfcTags: true } }, project: true },
  });
  if (!order) notFound();

  const physical = order.physicalOrder;
  const allowed = physical ? PHYSICAL_ORDER_TRANSITIONS[physical.status as keyof typeof PHYSICAL_ORDER_TRANSITIONS] ?? [] : [];

  return (
    <div>
      <h1 className="font-serif text-3xl">Pedido {order.orderNumber}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Criado em {formatDate(order.createdAt)}</p>

      <div className="mt-6 rounded-3xl border border-border bg-white p-6">
        <h2 className="font-serif text-xl">Itens</h2>
        <ul className="mt-3 divide-y divide-border">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-2 text-sm">
              <span>{i.description}</span>
              <span>{formatBRL(i.totalCents)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-border pt-3 text-right font-serif text-2xl">
          {formatBRL(order.total)}
        </p>
      </div>

      {physical && (
        <div className="mt-4 rounded-3xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl">Produção física</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Status: {PHYSICAL_ORDER_LABELS[physical.status] ?? physical.status}
              </p>
              {physical.sku && <p className="text-sm text-muted-foreground">SKU: {physical.sku}</p>}
            </div>
            <PhysicalActions physicalOrderId={physical.id} allowed={allowed} />
          </div>

          {physical.nfcTags.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-medium">Tags NFC</p>
              <ul className="mt-2 space-y-1 text-sm">
                {physical.nfcTags.map((t) => (
                  <li key={t.id} className="text-muted-foreground">
                    {t.publicToken} — {t.status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
