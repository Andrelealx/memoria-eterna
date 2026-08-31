"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminUpdatePlan } from "@/app/actions/admin";

// Edição inline do nome e da duração de um plano.

export function PlanName({ planId, name }: { planId: string; name: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      alert("Nome inválido.");
      return;
    }
    setBusy(true);
    try {
      await adminUpdatePlan(planId, { name: trimmed });
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
      <button type="button" onClick={() => setEditing(true)} className="font-serif text-lg hover:underline" title="Editar nome">
        {name}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="w-44 rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground"
      />
      <button type="button" onClick={save} disabled={busy} className="text-sm font-medium text-primary hover:underline">
        Salvar
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setValue(name);
        }}
        disabled={busy}
        className="text-sm text-muted-foreground hover:underline"
      >
        Cancelar
      </button>
    </span>
  );
}

const DURATION_OPTIONS: { value: string; label: string; days: number | null }[] = [
  { value: "none", label: "Sem expiração", days: null },
  { value: "7", label: "7 dias", days: 7 },
  { value: "30", label: "30 dias", days: 30 },
  { value: "90", label: "90 dias", days: 90 },
  { value: "180", label: "180 dias", days: 180 },
  { value: "365", label: "365 dias", days: 365 },
];

export function PlanDuration({ planId, durationDays }: { planId: string; durationDays: number | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(durationDays === null ? "none" : String(durationDays));

  const known = DURATION_OPTIONS.some((o) => o.value === value);
  const options = known
    ? DURATION_OPTIONS
    : [...DURATION_OPTIONS, { value, label: `${durationDays} dias`, days: durationDays }];

  async function change(v: string) {
    setValue(v);
    const days = options.find((o) => o.value === v)?.days ?? null;
    setBusy(true);
    try {
      await adminUpdatePlan(planId, { durationDays: days });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
      setValue(durationDays === null ? "none" : String(durationDays));
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      className="rounded-lg border border-border bg-card px-2 py-0.5 text-sm text-foreground"
      title="Duração"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
