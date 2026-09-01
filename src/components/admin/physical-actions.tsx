"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { adminTransitionPhysical } from "@/app/actions/admin";
import { PHYSICAL_ORDER_LABELS } from "@/lib/labels";

// Avança um pedido físico apenas para estados permitidos (state machine).
// SHIPPED exige código de rastreio (obrigatório na state machine/servidor).
export function PhysicalActions({
  physicalOrderId,
  allowed,
}: {
  physicalOrderId: string;
  allowed: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [shippingTarget, setShippingTarget] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [carrier, setCarrier] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(to: string, shipping?: { trackingCode?: string; carrier?: string }) {
    setBusy(to);
    setError(null);
    try {
      await adminTransitionPhysical(physicalOrderId, to as never, shipping);
      setShippingTarget(null);
      setTrackingCode("");
      setCarrier("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  if (allowed.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {allowed.map((to) =>
          to === "SHIPPED" ? (
            <button
              key={to}
              type="button"
              disabled={busy !== null}
              onClick={() => setShippingTarget(shippingTarget === to ? null : to)}
              className="rounded-xl border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary disabled:opacity-50"
            >
              Marcar como {PHYSICAL_ORDER_LABELS[to] ?? to}
            </button>
          ) : (
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
          ),
        )}
      </div>

      {shippingTarget && (
        <div className="w-full max-w-xs rounded-xl border border-border bg-secondary/40 p-3">
          <label className="text-xs font-medium text-muted-foreground">
            Código de rastreio
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Ex.: BR123456789BR"
              className="mt-1 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="mt-2 block text-xs font-medium text-muted-foreground">
            Transportadora (opcional)
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Ex.: Correios"
              className="mt-1 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground"
            />
          </label>
          <button
            type="button"
            disabled={busy !== null || trackingCode.trim().length === 0}
            onClick={() => run(shippingTarget, { trackingCode, carrier })}
            className="mt-3 w-full rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy === shippingTarget ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
            Confirmar envio
          </button>
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
