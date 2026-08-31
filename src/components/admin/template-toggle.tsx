"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminSetTemplateStatus } from "@/app/actions/admin";

// Ativa/arquiva um template. Templates arquivados somem do catálogo público.
export function TemplateToggle({ templateId, active }: { templateId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await adminSetTemplateStatus(templateId, active ? "ARCHIVED" : "ACTIVE");
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
      {active ? "Arquivar" : "Ativar"}
    </button>
  );
}
