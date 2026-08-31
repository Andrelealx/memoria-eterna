"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminToggleCoupon, adminDeleteCoupon } from "@/app/actions/admin";

// Ações por cupom: ativar/desativar e excluir (excluir só quando sem uso).
export function CouponActions({
  couponId,
  active,
  canDelete,
}: {
  couponId: string;
  active: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle() {
    setBusy("toggle");
    try {
      await adminToggleCoupon(couponId, !active);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Excluir este cupom?")) return;
    setBusy("delete");
    try {
      await adminDeleteCoupon(couponId);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy !== null}
        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
      >
        {active ? "Desativar" : "Ativar"}
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          disabled={busy !== null}
          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-error hover:bg-secondary disabled:opacity-50"
        >
          Excluir
        </button>
      )}
    </div>
  );
}
