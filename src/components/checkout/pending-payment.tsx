"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { approveOrderPayment } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";

// Tela de Pix pendente (seção 14). Em produção, consultaria o status no servidor.
// Em desenvolvimento, permite simular a aprovação (provedor fake).
export function PendingPayment({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      await approveOrderPayment(orderId);
      router.push(`/pagamento/sucesso?order=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-3xl">Pagamento pendente</h1>
      <p className="mt-3 text-muted-foreground">
        Aguardando a confirmação do seu Pix. Você pode voltar depois — o pedido fica salvo.
      </p>

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 w-full rounded-2xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">Ambiente de desenvolvimento</p>
          <Button onClick={approve} disabled={busy} className="mt-3 w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Simular aprovação do Pix
          </Button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-error">{error}</p>}
    </div>
  );
}
