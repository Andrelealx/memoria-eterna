import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { PAYMENT_STATUS_LABELS, PHYSICAL_ORDER_LABELS, formatDate } from "@/lib/labels";
import { readStoredPix } from "@/lib/server/orders";
import { RegeneratePix } from "@/components/painel/regenerate-pix";

export const metadata = { title: "Pedido" };
export const dynamic = "force-dynamic";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, customerId: user.id },
    include: {
      items: { include: { plan: true } },
      payments: { orderBy: { createdAt: "desc" } },
      physicalOrder: true,
    },
  });
  if (!order) notFound();

  // A mais recente: depois de gerar um novo Pix, pode existir mais de uma
  // tentativa de pagamento para o mesmo pedido.
  const payment = order.payments[0];
  const physical = order.physicalOrder;
  const isPendingPayment = payment?.status === "PENDING" || payment?.status === "CREATED";
  const currentPix =
    isPendingPayment && payment.method === "PIX" ? readStoredPix(payment.sanitizedPayload) : null;

  return (
    <div>
      <h1 className="font-serif text-3xl">Pedido {order.orderNumber}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Criado em {formatDate(order.createdAt)}</p>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl">Itens</h2>
        <ul className="mt-4 divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-muted-foreground">Qtd. {item.quantity}</p>
              </div>
              <p>{formatBRL(item.totalCents)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatBRL(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-success"><dt>Desconto</dt><dd>− {formatBRL(order.discount)}</dd></div>}
          {order.shipping > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Frete</dt><dd>{formatBRL(order.shipping)}</dd></div>}
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="font-medium">Total</p>
          <p className="font-serif text-2xl">{formatBRL(order.total)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Pagamento</p>
          <p className="mt-1 font-medium">
            {payment ? PAYMENT_STATUS_LABELS[payment.status] ?? payment.status : "—"}
          </p>
          {isPendingPayment && <RegeneratePix orderId={order.id} initialPix={currentPix} />}
        </div>
        {physical && (
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Produção física</p>
            <p className="mt-1 font-medium">
              {PHYSICAL_ORDER_LABELS[physical.status] ?? physical.status}
            </p>
            {physical.trackingCode && (
              <p className="mt-2 text-sm text-muted-foreground">Rastreio: {physical.trackingCode}</p>
            )}
            {physical.estimatedDays && !physical.trackingCode && (
              <p className="mt-2 text-sm text-muted-foreground">Estimativa informada na compra: {physical.estimatedDays} dias úteis</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
