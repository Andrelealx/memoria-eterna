import Link from "next/link";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  statusVariant,
} from "@/lib/labels";

export const metadata = { title: "Falhas de pagamento" };

const FAILED_STATUSES: PaymentStatus[] = ["REJECTED", "CANCELLED", "REFUNDED", "CHARGEDBACK"];
const PERIODS = { "7": "7 dias", "30": "30 dias", "90": "90 dias", all: "Tudo" } as const;
const STUCK_AFTER_HOURS = 3;
const PAGE_SIZE = 100;

function sinceDays(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export default async function AdminFalhasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const period = periodo && periodo in PERIODS ? periodo : "30";
  const since = period === "all" ? undefined : sinceDays(Number(period));

  const stuckThreshold = hoursAgo(STUCK_AFTER_HOURS);

  const [failedPayments, stuckOrders] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: { in: FAILED_STATUSES },
        ...(since ? { updatedAt: { gte: since } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      include: { order: true },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["CREATED", "AWAITING_PAYMENT"] },
        createdAt: { lt: stuckThreshold, ...(since ? { gte: since } : {}) },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      include: { payments: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Falhas de pagamento</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pagamentos recusados/cancelados e pedidos que ficaram sem resposta do provedor — útil para
        pegar um webhook perdido antes que o cliente precise reclamar.
      </p>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <select
          name="periodo"
          defaultValue={period}
          className="border-border bg-card rounded-xl border px-3 py-2 text-sm"
        >
          {Object.entries(PERIODS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Filtrar
        </button>
      </form>

      <h2 className="mt-10 font-serif text-xl">Pagamentos com falha</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-4">Pedido</th>
              <th className="py-2 pr-4">Data</th>
              <th className="py-2 pr-4">E-mail</th>
              <th className="py-2 pr-4">Valor</th>
              <th className="py-2 pr-4">Método</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {failedPayments.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2 pr-4">
                  <Link href={`/admin/pedidos/${p.order.id}`} className="text-primary hover:underline">
                    {p.order.orderNumber}
                  </Link>
                </td>
                <td className="py-2 pr-4">{formatDate(p.updatedAt)}</td>
                <td className="py-2 pr-4 text-muted-foreground">{p.order.checkoutEmail ?? "—"}</td>
                <td className="py-2 pr-4">{formatBRL(p.amount)}</td>
                <td className="py-2 pr-4">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</td>
                <td className="py-2 pr-4">
                  <Badge variant={statusVariant(p.status)}>
                    {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {failedPayments.length === 0 && (
          <p className="mt-4 text-muted-foreground">Nenhum pagamento com falha nesse período.</p>
        )}
        {failedPayments.length === PAGE_SIZE && (
          <p className="mt-4 text-xs text-muted-foreground">
            Mostrando os {PAGE_SIZE} mais recentes. Reduza o período para ver todos.
          </p>
        )}
      </div>

      <h2 className="mt-10 font-serif text-xl">Pedidos parados sem confirmação</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Criados há mais de {STUCK_AFTER_HOURS}h e ainda aguardando pagamento — pode ser abandono do
        cliente ou um webhook que não chegou. Confira o status real no Mercado Pago antes de agir.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-4">Pedido</th>
              <th className="py-2 pr-4">Criado em</th>
              <th className="py-2 pr-4">E-mail</th>
              <th className="py-2 pr-4">Valor</th>
              <th className="py-2 pr-4">Status do pedido</th>
              <th className="py-2 pr-4">Última tentativa</th>
            </tr>
          </thead>
          <tbody>
            {stuckOrders.map((o) => (
              <tr key={o.id} className="border-b border-border">
                <td className="py-2 pr-4">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-primary hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="py-2 pr-4">{formatDate(o.createdAt)}</td>
                <td className="py-2 pr-4 text-muted-foreground">{o.checkoutEmail ?? "—"}</td>
                <td className="py-2 pr-4">{formatBRL(o.total)}</td>
                <td className="py-2 pr-4">
                  <Badge variant={statusVariant(o.status)}>
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </Badge>
                </td>
                <td className="py-2 pr-4">
                  {o.payments[0] ? (
                    <Badge variant={statusVariant(o.payments[0].status)}>
                      {PAYMENT_STATUS_LABELS[o.payments[0].status] ?? o.payments[0].status}
                    </Badge>
                  ) : (
                    "sem tentativa"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stuckOrders.length === 0 && (
          <p className="mt-4 text-muted-foreground">Nenhum pedido parado nesse período.</p>
        )}
        {stuckOrders.length === PAGE_SIZE && (
          <p className="mt-4 text-xs text-muted-foreground">
            Mostrando os {PAGE_SIZE} mais recentes. Reduza o período para ver todos.
          </p>
        )}
      </div>
    </div>
  );
}
