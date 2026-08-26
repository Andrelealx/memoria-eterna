"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { adminTransitionPhysical } from "@/app/actions/admin";
import { PHYSICAL_ORDER_LABELS } from "@/lib/labels";

// Avança um pedido físico apenas para estados permitidos (state machine).
export function PhysicalActions({
  physicalOrderId,
  allowed,
}: {
  physicalOrderId: string;
  allowed: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(to: string) {
    setBusy(to);
    try {
      await adminTransitionPhysical(physicalOrderId, to as never);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  if (allowed.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {allowed.map((to) => (
        <button
          key={to}
          type="button"
          disabled={busy !== null}
          onClick={() => run(to)}
          className="rounded-xl border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary disabled:opacity-50"
        >
          {busy === to ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
          Marcar como {PHYSICAL_ORDER_LABELS[to] ?? to}
        </button>
      ))}
    </div>
  );
}
