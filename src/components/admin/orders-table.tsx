"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { adminDeleteOrders } from "@/app/actions/admin";
import { formatBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PHYSICAL_ORDER_LABELS,
  formatDate,
  statusVariant,
} from "@/lib/labels";

export interface OrderRow {
  id: string;
  orderNumber: string;
  createdAt: Date;
  checkoutEmail: string | null;
  total: number;
  status: string;
  payment: { status: string } | null;
  physicalOrder: { status: string } | null;
  locked: boolean; // pago/aprovado — não pode ser excluído por aqui
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectableIds = orders.filter((o) => !o.locked).map((o) => o.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function handleDelete() {
    if (selected.size === 0) return;
    const ok = window.confirm(
      `Excluir ${selected.size} pedido(s) permanentemente? Essa ação não pode ser desfeita.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const result = await adminDeleteOrders([...selected]);
      setSelected(new Set());
      router.refresh();
      if (result.skipped > 0) {
        window.alert(
          `${result.deleted} pedido(s) excluído(s). ${result.skipped} não foram excluídos por já terem pagamento aprovado.`,
        );
      }
    });
  }

  return (
    <div>
      {selectableIds.length === 0 && orders.length > 0 && (
        <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Todos os pedidos listados têm pagamento aprovado e por isso estão protegidos contra
          exclusão.
        </p>
      )}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-error/30 bg-error/5 px-4 py-2 text-sm">
          <span>{selected.size} pedido(s) selecionado(s)</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg bg-error px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Excluindo..." : "Excluir selecionados"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="py-2 pr-4">Pedido</th>
              <th className="py-2 pr-4">Data</th>
              <th className="py-2 pr-4">E-mail</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Pagamento</th>
              <th className="py-2 pr-4">Físico</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border">
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggle(o.id)}
                      disabled={o.locked}
                      aria-label={`Selecionar pedido ${o.orderNumber}`}
                    />
                    {o.locked && (
                      <span title="Pedido pago — protegido contra exclusão">
                        <Lock
                          aria-label="Pedido pago — protegido contra exclusão"
                          className="h-3.5 w-3.5 text-muted-foreground"
                        />
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-primary hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="py-2 pr-4">{formatDate(o.createdAt)}</td>
                <td className="py-2 pr-4 text-muted-foreground">{o.checkoutEmail ?? "—"}</td>
                <td className="py-2 pr-4">{formatBRL(o.total)}</td>
                <td className="py-2 pr-4">
                  <Badge variant={statusVariant(o.status)}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge>
                </td>
                <td className="py-2 pr-4">
                  {o.payment ? (
                    <Badge variant={statusVariant(o.payment.status)}>
                      {PAYMENT_STATUS_LABELS[o.payment.status] ?? o.payment.status}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4">
                  {o.physicalOrder ? (
                    <Badge variant={statusVariant(o.physicalOrder.status)}>
                      {PHYSICAL_ORDER_LABELS[o.physicalOrder.status] ?? o.physicalOrder.status}
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
    </div>
  );
}
