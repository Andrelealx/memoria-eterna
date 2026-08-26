import { getEnv, isFakePaymentEnabled } from "@/lib/env";
import type { PaymentProvider } from "./types";
import { FakePaymentProvider } from "./fake";
import { MercadoPagoProvider } from "./mercado-pago";

export type { PaymentProvider, CreatePaymentInput, CreatePaymentResult, WebhookEvent } from "./types";

// Factory que devolve o provedor ativo (seção 14). Em desenvolvimento sem
// credenciais, usa o provedor FAKE (somente dev). Em produção, exige Mercado Pago.
export function getPaymentProvider(): PaymentProvider {
  const env = getEnv();

  if (env.NODE_ENV === "production") {
    if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error(
        "[payment] MERCADO_PAGO_ACCESS_TOKEN é obrigatório em produção (nenhum provedor fake é permitido).",
      );
    }
    return new MercadoPagoProvider(
      env.MERCADO_PAGO_ACCESS_TOKEN,
      env.MERCADO_PAGO_WEBHOOK_SECRET,
    );
  }

  // Desenvolvimento: usa fake apenas quando explicitamente habilitado.
  if (isFakePaymentEnabled()) {
    return new FakePaymentProvider();
  }

  if (env.MERCADO_PAGO_ACCESS_TOKEN) {
    return new MercadoPagoProvider(
      env.MERCADO_PAGO_ACCESS_TOKEN,
      env.MERCADO_PAGO_WEBHOOK_SECRET,
    );
  }

  // Sem credencial e sem fake habilitado: falha clara em vez de fingir sucesso.
  throw new Error(
    "[payment] Nenhum provedor configurado. Defina MERCADO_PAGO_ACCESS_TOKEN ou DEV_FAKE_PAYMENT_ENABLED=true (apenas dev).",
  );
}
