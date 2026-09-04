"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { adminReconcileOrderPayment } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

const LABELS: Record<string, string> = {
  APPROVED: "Confirmado — presente publicado",
  REJECTED: "Recusado no provedor",
  CANCELLED: "Cancelado no provedor",
  PENDING: "Ainda pendente no provedor",
  CREATED: "Ainda pendente no provedor",
  "sem pagamento pendente": "Sem pagamento pendente",
};

/**
 * Pergunta ao Mercado Pago qual é o status real do pagamento e aplica o
 * resultado. Não "aprova" nada: quem decide é o provedor.
 */
export function ReconcilePaymentButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const r = await adminReconcileOrderPayment(orderId);
              setResult(LABELS[r.status] ?? r.status);
            } catch (cause) {
              setResult(cause instanceof Error ? cause.message : "Falha na consulta");
            }
          })
        }
      >
        <RefreshCw aria-hidden className={pending ? "animate-spin" : ""} />
        {pending ? "Consultando…" : "Reconsultar"}
      </Button>
      {result && (
        <span className="text-muted-foreground text-xs" role="status">
          {result}
        </span>
      )}
    </div>
  );
}
