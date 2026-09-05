"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import {
  approveOrderPayment,
  getOrderPaymentStatus,
  regeneratePixOnPendingScreen,
} from "@/app/actions/checkout";
import { Button, buttonVariants } from "@/components/ui/button";
import { PaymentFrame } from "@/components/checkout/payment-frame";

interface PixData {
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}

function isPixData(value: unknown): value is PixData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.qrCode === "string" &&
    candidate.qrCode.length > 0 &&
    typeof candidate.qrCodeBase64 === "string" &&
    typeof candidate.expiresAt === "string" &&
    Number.isFinite(new Date(candidate.expiresAt).getTime())
  );
}

// Tela de Pix pendente (seção 14). Recupera a cobrança no servidor usando um
// cookie HttpOnly; sessionStorage é apenas um cache rápido, nunca a fonte única.
export function PendingPayment({ orderId }: { orderId: string }) {
  const router = useRouter();
  const mountedRef = useRef(false);
  const checkingRef = useRef(false);
  const needsPixRef = useRef(true);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const [accessUnavailable, setAccessUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [pixExpired, setPixExpired] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadStoredPix = () => {
      try {
        const raw = sessionStorage.getItem(`presente-vivo:pix:${orderId}`);
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (isPixData(parsed)) {
          setPix(parsed);
          setPixExpired(new Date(parsed.expiresAt).getTime() <= Date.now());
        } else {
          sessionStorage.removeItem(`presente-vivo:pix:${orderId}`);
        }
      } catch {
        try {
          sessionStorage.removeItem(`presente-vivo:pix:${orderId}`);
        } catch {
          // Alguns navegadores podem bloquear o armazenamento; a recuperação
          // server-side continua funcionando normalmente.
        }
      }
    };
    queueMicrotask(loadStoredPix);
  }, [orderId]);

  useEffect(() => {
    if (!pix) return;
    const expirationTime = new Date(pix.expiresAt).getTime();
    if (!Number.isFinite(expirationTime)) return;
    const remaining = expirationTime - Date.now();
    if (remaining <= 0) {
      queueMicrotask(() => setPixExpired(true));
      return;
    }

    const timer = window.setTimeout(() => setPixExpired(true), remaining);
    return () => window.clearTimeout(timer);
  }, [pix]);

  const checkPayment = useCallback(
    async (initial = false) => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      if (mountedRef.current) {
        setChecking(true);
        if (initial) setRecovering(true);
      }

      try {
        const result = await getOrderPaymentStatus(orderId, needsPixRef.current);
        if (!mountedRef.current) return;

        setLastCheckedAt(new Date());
        setError(null);
        if (result.status === "approved") {
          try {
            sessionStorage.removeItem(`presente-vivo:pix:${orderId}`);
          } catch {
            // A navegação não depende do cache local.
          }
          router.replace(`/pagamento/sucesso?order=${orderId}`);
          return;
        }
        if (result.status === "failed") {
          try {
            sessionStorage.removeItem(`presente-vivo:pix:${orderId}`);
          } catch {
            // A navegação não depende do cache local.
          }
          router.replace(`/pagamento/falha?order=${orderId}`);
          return;
        }
        if (result.status === "unavailable") {
          setAccessUnavailable(true);
          return;
        }

        setAccessUnavailable(false);
        needsPixRef.current = false;
        if (result.pix && isPixData(result.pix)) {
          setPix(result.pix);
          setPixExpired(new Date(result.pix.expiresAt).getTime() <= Date.now());
          try {
            sessionStorage.setItem(`presente-vivo:pix:${orderId}`, JSON.stringify(result.pix));
          } catch {
            // O Pix já está em memória; persistência local é opcional.
          }
        }
      } catch {
        if (mountedRef.current) {
          setError("Não conseguimos atualizar agora. Vamos tentar novamente automaticamente.");
        }
      } finally {
        checkingRef.current = false;
        if (mountedRef.current) {
          setChecking(false);
          if (initial) setRecovering(false);
        }
      }
    },
    [orderId, router],
  );

  useEffect(() => {
    queueMicrotask(() => void checkPayment(true));
    const timer = window.setInterval(() => void checkPayment(), 4000);
    return () => window.clearInterval(timer);
  }, [checkPayment]);

  async function copyPix() {
    if (!pix?.qrCode) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const field = document.querySelector<HTMLTextAreaElement>("#pix-code");
      field?.select();
      const copiedWithFallback = field ? document.execCommand("copy") : false;
      if (copiedWithFallback) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } else {
        setError("Não foi possível copiar automaticamente. Selecione o código acima e copie.");
      }
    }
  }

  async function regenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const result = await regeneratePixOnPendingScreen(orderId);
      if (result.status === "approved") {
        try {
          sessionStorage.removeItem(`presente-vivo:pix:${orderId}`);
        } catch {
          // A navegação não depende do cache local.
        }
        router.replace(`/pagamento/sucesso?order=${orderId}`);
        return;
      }
      if (result.status === "pending" && result.pix) {
        setPix(result.pix);
        setPixExpired(new Date(result.pix.expiresAt).getTime() <= Date.now());
        try {
          sessionStorage.setItem(`presente-vivo:pix:${orderId}`, JSON.stringify(result.pix));
        } catch {
          // O Pix já está em memória; persistência local é opcional.
        }
      } else {
        setError("Não foi possível gerar um novo Pix agora. Tente novamente em instantes.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar um novo Pix.");
    } finally {
      setRegenerating(false);
    }
  }

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      await approveOrderPayment(orderId);
      router.push(`/pagamento/sucesso?order=${orderId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível simular a aprovação.");
    } finally {
      setBusy(false);
    }
  }

  const expiresAt = pix ? new Date(pix.expiresAt) : null;
  const hasValidExpiration = Boolean(expiresAt && Number.isFinite(expiresAt.getTime()));
  const isExpired = hasValidExpiration && pixExpired;

  return (
    <PaymentFrame>
      <section className="w-full text-center">
        <div className="bg-primary/10 text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full">
          <ShieldCheck aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="text-primary mt-4 text-xs font-semibold tracking-[0.18em] uppercase">
          Pagamento protegido
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
          {pix
            ? "Seu Pix está pronto"
            : recovering
              ? "Recuperando seu Pix"
              : "Vamos localizar seu Pix"}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-lg leading-7">
          {pix
            ? "Pague pelo aplicativo do seu banco. Esta página verifica a confirmação automaticamente."
            : "Para sua segurança, confirmamos o acesso antes de mostrar qualquer dado da cobrança."}
        </p>

        {recovering && !pix && (
          <div
            className="border-border bg-card mt-7 flex w-full items-center justify-center gap-3 rounded-3xl border p-6 text-sm"
            role="status"
          >
            <Loader2 aria-hidden="true" className="text-primary h-5 w-5 animate-spin" />
            Recuperando sua cobrança com segurança…
          </div>
        )}

        {pix && (
          <>
            {/* A maior perda do funil está exatamente aqui: gente que gera o
                Pix e não chega a pagar. O lembrete do presente de cortesia é o
                motivo mais forte que temos para a pessoa concluir agora. */}
            <div className="border-accent/40 bg-accent/10 mt-6 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm leading-6">
              <span className="text-lg leading-none" aria-hidden>
                🎁
              </span>
              <span>
                <strong className="font-semibold">Assim que o pagamento cair</strong>, seu presente
                é publicado na hora e você ainda recebe um cupom para criar um{" "}
                <strong className="font-semibold">segundo presente de cortesia</strong>.
              </span>
            </div>
            <ol
              className="border-border bg-card mt-4 grid gap-3 rounded-2xl border p-4 text-left text-sm sm:grid-cols-3"
              aria-label="Como pagar o Pix"
            >
              {[
                ["1", "Abra o app do banco"],
                ["2", "Escolha pagar com Pix"],
                ["3", "Escaneie ou copie"],
              ].map(([step, label]) => (
                <li key={step} className="flex items-center gap-3 sm:flex-col sm:text-center">
                  <span className="bg-secondary text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {step}
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>

            <div className="border-border bg-card mt-4 w-full rounded-3xl border p-5 text-left shadow-sm sm:p-6">
              {pix.qrCodeBase64.length > 100 && (
                <Image
                  src={
                    pix.qrCodeBase64.startsWith("data:")
                      ? pix.qrCodeBase64
                      : `data:image/png;base64,${pix.qrCodeBase64}`
                  }
                  alt="QR Code do Pix para pagamento"
                  width={220}
                  height={220}
                  unoptimized
                  className="mx-auto rounded-xl"
                />
              )}
              <label htmlFor="pix-code" className="mt-4 block text-sm font-medium">
                Pix copia e cola
              </label>
              <textarea
                id="pix-code"
                readOnly
                value={pix.qrCode}
                rows={3}
                spellCheck={false}
                aria-describedby={hasValidExpiration ? "pix-expiration" : undefined}
                onFocus={(event) => event.currentTarget.select()}
                className="border-border bg-background mt-2 w-full resize-none rounded-xl border p-3 font-mono text-xs"
              />
              <Button type="button" onClick={copyPix} disabled={isExpired} className="mt-3 w-full">
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? "Código copiado" : isExpired ? "Código expirado" : "Copiar código Pix"}
              </Button>
              <span className="sr-only" aria-live="polite">
                {copied ? "Código Pix copiado para a área de transferência." : ""}
              </span>
              {hasValidExpiration && expiresAt && (
                <p
                  id="pix-expiration"
                  className={`mt-3 text-center text-xs ${isExpired ? "text-error" : "text-muted-foreground"}`}
                  role={isExpired ? "alert" : undefined}
                >
                  {isExpired ? "Este código expirou em" : "Código válido até"}{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(expiresAt)}
                  .
                </p>
              )}

              {isExpired && (
                <div className="bg-error/10 mt-4 rounded-2xl p-4 text-sm leading-6">
                  <p className="font-medium">Não pague este código.</p>
                  <p className="text-muted-foreground mt-1">
                    Se você já pagou, não gere outro — estamos verificando a confirmação
                    automaticamente. Se ainda não pagou, pode gerar um Pix novo abaixo.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={regenerate}
                    disabled={regenerating}
                    className="mt-3 w-full"
                  >
                    <RefreshCw aria-hidden className={regenerating ? "animate-spin" : ""} />
                    {regenerating ? "Gerando novo Pix…" : "Gerar novo Pix"}
                  </Button>
                  <Link
                    href="/ajuda"
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className: "mt-2 w-full",
                    })}
                  >
                    Ver orientações de pagamento
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {!recovering && !pix && (
          <div className="bg-secondary mt-6 w-full rounded-2xl p-5 text-left text-sm">
            <p className="font-medium">
              {accessUnavailable
                ? "Não encontramos o acesso seguro desta cobrança."
                : "O provedor não disponibilizou novamente o código desta cobrança."}
            </p>
            <p className="text-muted-foreground mt-1 leading-6">
              {accessUnavailable
                ? "Abra esta página no mesmo navegador em que o Pix foi gerado. Se você já pagou, não faça outra tentativa: consulte seus pedidos."
                : "Se você já pagou, aguarde. Continuaremos consultando a confirmação e o acesso também ficará disponível em seus pedidos."}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/entrar" className={buttonVariants({ size: "sm", className: "w-full" })}>
                Consultar meus pedidos
              </Link>
              <Link
                href="/ajuda"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "w-full",
                })}
              >
                Preciso de ajuda
              </Link>
            </div>
          </div>
        )}

        <div className="mt-5 flex w-full items-center justify-between gap-3 text-left">
          <p className="text-muted-foreground text-xs">
            {checking
              ? "Verificando pagamento…"
              : lastCheckedAt
                ? `Última verificação às ${lastCheckedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : "Aguardando primeira verificação"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void checkPayment()}
            disabled={checking}
            aria-label="Verificar pagamento agora"
          >
            <RefreshCw aria-hidden="true" className={checking ? "animate-spin" : ""} />
            Verificar agora
          </Button>
        </div>

        {error && (
          <p className="bg-error/10 text-error mt-4 rounded-2xl p-3 text-left text-sm" role="alert">
            {error}
          </p>
        )}

        <p className="text-muted-foreground mt-4 text-xs leading-5">
          Você pode fechar esta página sem perder o pedido. Depois da confirmação, o presente ficará
          disponível em seus pedidos e no e-mail informado na compra.
        </p>

        {process.env.NODE_ENV !== "production" && (
          <div className="border-border bg-card mt-8 w-full rounded-2xl border p-4">
            <p className="text-muted-foreground text-sm">Ambiente de desenvolvimento</p>
            <Button
              onClick={approve}
              disabled={busy || recovering || accessUnavailable}
              className="mt-3 w-full"
            >
              {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
              Simular aprovação do Pix
            </Button>
          </div>
        )}
      </section>
    </PaymentFrame>
  );
}
