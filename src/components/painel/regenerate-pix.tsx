"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { regenerateOrderPix } from "@/app/actions/customer-orders";
import { Button } from "@/components/ui/button";

interface PixData {
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}

/**
 * Card de Pix na tela do pedido, dentro de /painel — funciona em qualquer
 * aparelho onde a pessoa faça login, sem depender do cookie criado no
 * navegador em que a compra começou.
 */
export function RegeneratePix({
  orderId,
  initialPix,
}: {
  orderId: string;
  initialPix: PixData | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pix, setPix] = useState(initialPix);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!pix) return;
    const expirationTime = new Date(pix.expiresAt).getTime();
    const remaining = Number.isFinite(expirationTime) ? expirationTime - Date.now() : 0;
    // Um Pix novo pode chegar depois de um que já tinha expirado — sem isso o
    // aviso de expirado ficaria preso mesmo com o código atual ainda válido.
    queueMicrotask(() => setIsExpired(remaining <= 0));
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setIsExpired(true), remaining);
    return () => window.clearTimeout(timer);
  }, [pix]);

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await regenerateOrderPix(orderId);
        if (result.status === "approved") {
          router.refresh();
          return;
        }
        if (result.status === "pending" && result.pix) {
          setPix(result.pix);
        } else {
          setError("Não foi possível gerar o Pix agora. Tente novamente em alguns segundos.");
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Não foi possível gerar o Pix.");
      }
    });
  }

  async function copyPix() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
      {pix && !isExpired ? (
        <>
          {pix.qrCodeBase64.length > 100 && (
            <Image
              src={
                pix.qrCodeBase64.startsWith("data:")
                  ? pix.qrCodeBase64
                  : `data:image/png;base64,${pix.qrCodeBase64}`
              }
              alt="QR Code do Pix"
              width={180}
              height={180}
              unoptimized
              className="mx-auto rounded-xl"
            />
          )}
          <textarea
            readOnly
            value={pix.qrCode}
            rows={2}
            spellCheck={false}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-2.5 font-mono text-xs"
          />
          <Button type="button" size="sm" onClick={copyPix} className="mt-2 w-full">
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Válido até{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(pix.expiresAt))}
            .
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {pix ? "O código Pix anterior expirou." : "Ainda não geramos um Pix para este pedido."}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={generate}
        className="mt-3 w-full"
      >
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <RefreshCw aria-hidden />
        )}
        {pending ? "Gerando…" : pix ? "Gerar novo Pix" : "Gerar Pix"}
      </Button>

      {error && (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
