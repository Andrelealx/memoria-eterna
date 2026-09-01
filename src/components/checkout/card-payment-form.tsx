"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Formulário de cartão via Card Form do Mercado Pago (SDK oficial v2).
// Número, validade e CVV ficam em campos seguros (iframe) hospedados pelo
// Mercado Pago — esses dados NUNCA passam pelo nosso servidor, nem pelo
// JavaScript desta página. Só recebemos de volta um token de uso único.
// Doc: https://www.mercadopago.com.br/developers/pt/docs/checkout-api

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  cardForm(options: {
    amount: string;
    iframe: boolean;
    form: {
      id: string;
      cardNumber: { id: string; placeholder?: string };
      expirationDate: { id: string; placeholder?: string };
      securityCode: { id: string; placeholder?: string };
      cardholderName: { id: string; placeholder?: string };
      issuer: { id: string; placeholder?: string };
      installments: { id: string; placeholder?: string };
      identificationType: { id: string };
      identificationNumber: { id: string; placeholder?: string };
      cardholderEmail: { id: string; placeholder?: string };
    };
    callbacks: {
      onFormMounted?: (error?: unknown) => void;
      onSubmit: (event: Event) => void;
      onFetching?: (resource: string) => void | (() => void);
      onError?: (error: unknown) => void;
    };
  }): CardFormController;
}

interface CardFormController {
  getCardFormData(): {
    token: string;
    paymentMethodId: string;
    issuerId: string;
    cardholderEmail: string;
    amount: string;
    installments: string;
    identificationNumber: string;
    identificationType: string;
  };
}

const SDK_SRC = "https://sdk.mercadopago.com/js/v2";
const FORM_ID = "mp-card-form";

export interface CardTokenData {
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId: string;
  identificationNumber: string;
}

export interface CardPaymentFormHandle {
  submit: () => void;
}

function loadMercadoPagoSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  const existing = document.getElementById("mp-sdk-v2") as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar o Mercado Pago.")));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "mp-sdk-v2";
    script.src = SDK_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o Mercado Pago."));
    document.head.appendChild(script);
  });
}

export const CardPaymentForm = forwardRef<
  CardPaymentFormHandle,
  {
    publicKey: string;
    amountCents: number;
    payerEmail: string;
    payerName: string;
    disabled?: boolean;
    onTokenized: (data: CardTokenData) => void;
    onError: (message: string) => void;
  }
>(function CardPaymentForm(
  { publicKey, amountCents, payerEmail, payerName, disabled, onTokenized, onError },
  ref,
) {
  const controllerRef = useRef<CardFormController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tokenizing, setTokenizing] = useState(false);

  useImperativeHandle(ref, () => ({
    submit: () => formRef.current?.requestSubmit(),
  }));

  useEffect(() => {
    let cancelled = false;

    loadMercadoPagoSdk()
      .then(() => {
        if (cancelled || !window.MercadoPago) return;
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        controllerRef.current = mp.cardForm({
          amount: String(amountCents / 100),
          iframe: true,
          form: {
            id: FORM_ID,
            cardNumber: { id: "mp-card-number", placeholder: "0000 0000 0000 0000" },
            expirationDate: { id: "mp-expiration-date", placeholder: "MM/AA" },
            securityCode: { id: "mp-security-code", placeholder: "CVV" },
            cardholderName: { id: "mp-cardholder-name", placeholder: "Nome impresso no cartão" },
            issuer: { id: "mp-issuer" },
            installments: { id: "mp-installments" },
            identificationType: { id: "mp-identification-type" },
            identificationNumber: { id: "mp-identification-number", placeholder: "000.000.000-00" },
            cardholderEmail: { id: "mp-cardholder-email" },
          },
          callbacks: {
            onFormMounted: (error) => {
              if (cancelled) return;
              if (error) {
                setStatus("error");
                onError("Não foi possível carregar o formulário de cartão.");
                return;
              }
              setStatus("ready");
            },
            onSubmit: (event) => {
              event.preventDefault();
              if (!controllerRef.current) return;
              try {
                const data = controllerRef.current.getCardFormData();
                if (!data.token) {
                  onError("Confira os dados do cartão e tente novamente.");
                  setTokenizing(false);
                  return;
                }
                onTokenized({
                  token: data.token,
                  installments: Number(data.installments),
                  paymentMethodId: data.paymentMethodId,
                  issuerId: data.issuerId,
                  identificationNumber: data.identificationNumber,
                });
              } catch {
                onError("Confira os dados do cartão e tente novamente.");
                setTokenizing(false);
              }
            },
            onFetching: () => {
              setTokenizing(true);
              return () => setTokenizing(false);
            },
            onError: () => {
              setTokenizing(false);
              onError("Não foi possível processar o cartão. Confira os dados e tente novamente.");
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          onError("Não foi possível carregar o formulário de cartão. Verifique sua conexão.");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- monta apenas uma vez; valores iniciais bastam ao Card Form.
  }, [publicKey]);

  return (
    <div className="relative">
      {status === "loading" && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando formulário seguro do cartão…
        </p>
      )}
      <form
        id={FORM_ID}
        ref={formRef}
        className={cn("space-y-4", status !== "ready" && "hidden")}
      >
        <div>
          <Label htmlFor="mp-card-number">Número do cartão</Label>
          <div id="mp-card-number" className={fieldBoxClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="mp-expiration-date">Validade</Label>
            <div id="mp-expiration-date" className={fieldBoxClass} />
          </div>
          <div>
            <Label htmlFor="mp-security-code">CVV</Label>
            <div id="mp-security-code" className={fieldBoxClass} />
          </div>
        </div>

        <div>
          <Label htmlFor="mp-cardholder-name">Nome impresso no cartão</Label>
          <Input
            id="mp-cardholder-name"
            name="cardholderName"
            autoComplete="cc-name"
            defaultValue={payerName}
            required
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="mp-identification-number">CPF do titular</Label>
            <Input
              id="mp-identification-number"
              name="identificationNumber"
              inputMode="numeric"
              autoComplete="off"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="mp-installments">Parcelas</Label>
            <select
              id="mp-installments"
              name="installments"
              className="border-border bg-card text-foreground focus-visible:ring-ring mt-1.5 flex h-11 w-full rounded-xl border px-3 py-2 text-base focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>
        </div>

        {/* Campos ocultos gerenciados pelo SDK (bandeira/emissor e o e-mail já
            informado no passo anterior do checkout). */}
        <select id="mp-issuer" name="issuer" className="hidden" />
        <select id="mp-identification-type" name="identificationType" className="hidden">
          <option value="CPF">CPF</option>
        </select>
        <input
          id="mp-cardholder-email"
          name="cardholderEmail"
          type="hidden"
          defaultValue={payerEmail}
        />

        <button type="submit" className="hidden" disabled={disabled || tokenizing} aria-hidden />
      </form>
      {status === "error" && (
        <p className="text-error text-sm" role="alert">
          Não foi possível carregar o formulário de cartão. Recarregue a página ou pague com Pix.
        </p>
      )}
    </div>
  );
});

const fieldBoxClass =
  "border-border bg-card mt-1.5 flex h-11 w-full items-center rounded-xl border px-3 [&_iframe]:h-full [&_iframe]:w-full";
