import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { PHYSICAL_ORDER_LABELS, formatDate } from "@/lib/labels";

export const metadata = { title: "Pedidos" };

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { physicalOrder: true, payments: true },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Pedidos</h1>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-4">Pedido</th>
              <th className="py-2 pr-4">Data</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Pagamento</th>
              <th className="py-2 pr-4">Físico</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border">
                <td className="py-2 pr-4">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-primary hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="py-2 pr-4">{formatDate(o.createdAt)}</td>
                <td className="py-2 pr-4">{formatBRL(o.total)}</td>
                <td className="py-2 pr-4">{o.payments[0]?.status ?? "—"}</td>
                <td className="py-2 pr-4">
                  {o.physicalOrder ? PHYSICAL_ORDER_LABELS[o.physicalOrder.status] ?? o.physicalOrder.status : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="mt-4 text-muted-foreground">Nenhum pedido.</p>}
      </div>
    </div>
  );
}
