"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminUpdatePlanPrice } from "@/app/actions/admin";
import { formatBRL } from "@/lib/utils";

// Edição inline do preço do plano (reais → centavos no servidor).
export function PlanPrice({ planId, priceCents }: { planId: string; priceCents: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState((priceCents / 100).toFixed(2).replace(".", ","));
  const [busy, setBusy] = useState(false);

  async function save() {
    const reais = Number(value.replace(",", "."));
    if (!Number.isFinite(reais) || reais <= 0) {
      alert("Preço inválido.");
      return;
    }
    setBusy(true);
    try {
      await adminUpdatePlanPrice(planId, Math.round(reais * 100));
      setEditing(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-primary underline-offset-2 hover:underline"
        title="Editar preço"
      >
        {formatBRL(priceCents)}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="decimal"
        autoFocus
        className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground"
      />
      <button type="button" onClick={save} disabled={busy} className="text-sm font-medium text-primary hover:underline">
        Salvar
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={busy}
        className="text-sm text-muted-foreground hover:underline"
      >
        Cancelar
      </button>
    </span>
  );
}
