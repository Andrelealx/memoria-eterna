import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { ReconcilePaymentButton } from "@/components/admin/reconcile-payment-button";
import { PHYSICAL_ORDER_TRANSITIONS } from "@/lib/domain/state-machine";
import {
  NFC_TAG_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PHYSICAL_ORDER_LABELS,
  formatDate,
  statusVariant,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { PhysicalActions } from "@/components/admin/physical-actions";
import { shippingAddressSchema } from "@/lib/domain/checkout";

export const metadata = { title: "Pedido" };

export default async function AdminPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { plan: true } },
      payments: { orderBy: { createdAt: "desc" } },
      physicalOrder: { include: { nfcTags: true } },
      project: true,
      customer: true,
    },
  });
  if (!order) notFound();

  const physical = order.physicalOrder;
  const allowed = physical ? PHYSICAL_ORDER_TRANSITIONS[physical.status as keyof typeof PHYSICAL_ORDER_TRANSITIONS] ?? [] : [];
  const address = shippingAddressSchema.safeParse(order.addressSnapshot ?? undefined);
  const email = order.checkoutEmail ?? order.customer?.email;

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar aos pedidos
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl">Pedido {order.orderNumber}</h1>
            <Badge variant={statusVariant(order.status)}>
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Criado em {formatDate(order.createdAt)}
            {email && <> · {email}</>}
          </p>
        </div>
        {order.project?.status === "PUBLISHED" && order.project.slug && (
          <Link
            href={`/presente/${order.project.slug}`}
            target="_blank"
            className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            Ver página do presente <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
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

      <div className="mt-4 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-serif text-xl">Pagamento</h2>
          {order.payments.some((p) => p.status === "PENDING" || p.status === "CREATED") && (
            <ReconcilePaymentButton orderId={order.id} />
          )}
        </div>
        {order.payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma cobrança criada ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {order.payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(p.status)}>
                    {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                  <span>{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatBRL(p.amount)}
                  {p.providerPaymentId && <> · ref. {p.providerPaymentId}</>}
                  {" · "}
                  {formatDate(p.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {physical && (
        <div className="mt-4 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-serif text-xl">Endereço de entrega</h2>
          {address.success ? (
            <address className="mt-3 text-sm leading-6 text-foreground not-italic">
              {address.data.recipient}
              <br />
              {address.data.street}, {address.data.number}
              {address.data.complement ? ` — ${address.data.complement}` : ""}
              <br />
              {address.data.neighborhood} — {address.data.city}/{address.data.state}
              <br />
              CEP {address.data.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
            </address>
          ) : (
            <p className="mt-3 text-sm text-error">
              Endereço não encontrado ou inválido para este pedido. Verifique antes de embalar/enviar.
            </p>
          )}
        </div>
      )}

      {physical && (
        <div className="mt-4 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl">Produção física</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Status: {PHYSICAL_ORDER_LABELS[physical.status] ?? physical.status}
              </p>
              {physical.sku && <p className="text-sm text-muted-foreground">SKU: {physical.sku}</p>}
              {physical.trackingCode && (
                <p className="text-sm text-muted-foreground">
                  Rastreio: {physical.trackingCode}
                  {physical.carrier ? ` (${physical.carrier})` : ""}
                </p>
              )}
            </div>
            <PhysicalActions physicalOrderId={physical.id} allowed={allowed} />
          </div>

          {physical.nfcTags.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-medium">Tags NFC</p>
              <ul className="mt-2 space-y-1 text-sm">
                {physical.nfcTags.map((t) => (
                  <li key={t.id} className="text-muted-foreground">
                    {t.publicToken} — {NFC_TAG_LABELS[t.status] ?? t.status}
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
