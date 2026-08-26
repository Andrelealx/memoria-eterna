"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminTogglePlan } from "@/app/actions/admin";

export function PlanToggle({ planId, active }: { planId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await adminTogglePlan(planId, !active);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
    >
      {active ? "Desativar" : "Ativar"}
    </button>
  );
}
