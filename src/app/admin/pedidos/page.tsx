import Link from "next/link";
import type { OrderStatus, PhysicalOrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { OrdersTable, type OrderRow } from "@/components/admin/orders-table";
import { ORDER_STATUS_LABELS, PHYSICAL_ORDER_LABELS } from "@/lib/labels";

export const metadata = { title: "Pedidos" };

const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS);
const PHYSICAL_STATUSES = Object.keys(PHYSICAL_ORDER_LABELS);
const PAGE_SIZE = 50;

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; physicalStatus?: string }>;
}) {
  const { q, status, physicalStatus } = await searchParams;
  const query = q?.trim();

  const where: Prisma.OrderWhereInput = {
    ...(status && ORDER_STATUSES.includes(status) ? { status: status as OrderStatus } : {}),
    ...(physicalStatus && PHYSICAL_STATUSES.includes(physicalStatus)
      ? { physicalOrder: { status: physicalStatus as PhysicalOrderStatus } }
      : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" } },
            { checkoutEmail: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    include: { physicalOrder: true, payments: true },
  });

  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    checkoutEmail: o.checkoutEmail,
    total: o.total,
    status: o.status,
    payment: o.payments[0] ? { status: o.payments[0].status } : null,
    physicalOrder: o.physicalOrder ? { status: o.physicalOrder.status } : null,
    // Só trava exclusão quando existe dinheiro real por trás — pagamento do
    // provedor "fake" é dado de demonstração semeado no banco, nunca foi
    // cobrado de ninguém. A regra de verdade mora em adminDeleteOrders; isto
    // aqui só evita mostrar um checkbox habilitado que o servidor recusaria.
    locked: o.payments.some((p) => p.status === "APPROVED" && p.provider !== "fake"),
  }));

  return (
    <div>
      <h1 className="font-serif text-3xl">Pedidos</h1>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por número do pedido ou e-mail"
          className="border-border bg-card min-w-[260px] flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border-border bg-card rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="physicalStatus"
          defaultValue={physicalStatus ?? ""}
          className="border-border bg-card rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Toda produção física</option>
          {PHYSICAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PHYSICAL_ORDER_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Filtrar
        </button>
        {(query || status || physicalStatus) && (
          <Link
            href="/admin/pedidos"
            className="text-muted-foreground hover:text-primary self-center text-sm underline"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="mt-6">
        {orders.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            {query || status || physicalStatus
              ? "Nenhum pedido encontrado com esse filtro."
              : "Nenhum pedido."}
          </p>
        ) : (
          <OrdersTable orders={rows} />
        )}
        {orders.length === PAGE_SIZE && (
          <p className="mt-4 text-xs text-muted-foreground">
            Mostrando os {PAGE_SIZE} pedidos mais recentes. Refine a busca para achar pedidos mais antigos.
          </p>
        )}
      </div>
    </div>
  );
}
