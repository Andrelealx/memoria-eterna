import Link from "next/link";
import { requireUser } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_LABELS, formatDate, statusVariant } from "@/lib/labels";

export const metadata = { title: "Meus pedidos" };

export default async function PedidosPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { payments: true },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Meus pedidos</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Você ainda não fez nenhum pedido.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4">Pedido</th>
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border">
                  <td className="py-2 pr-4">
                    <Link href={`/painel/pedidos/${o.id}`} className="text-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{formatDate(o.createdAt)}</td>
                  <td className="py-2 pr-4">{formatBRL(o.total)}</td>
                  <td className="py-2 pr-4">
                    {o.payments[0] ? (
                      <Badge variant={statusVariant(o.payments[0].status)}>
                        {PAYMENT_STATUS_LABELS[o.payments[0].status] ?? o.payments[0].status}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
