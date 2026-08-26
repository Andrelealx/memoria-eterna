import type { PaymentMethod, PaymentStatus } from "@/lib/domain/enums";

// Contrato do provedor de pagamento (seções 6, 14). Preparado para Mercado Pago
// e, futuramente, Stripe. O sistema opera em BRL (centavos inteiros).

export interface PayerInfo {
  email: string;
  name?: string;
  identificationType?: string;
  identificationNumber?: string;
}

export interface CreatePaymentInput {
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
  idempotencyKey: string;
  payer: PayerInfo;
  description: string;
}

export interface PixResult {
  qrCode: string; // "emv" copia-e-cola
  qrCodeBase64: string;
  expiresAt: string; // ISO
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  status: PaymentStatus;
  pix?: PixResult;
  redirectUrl?: string;
}

export interface WebhookEvent {
  providerEventId: string;
  type: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  /** Cria uma intenção de pagamento no provedor. */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Consulta o status atual no provedor (fonte da verdade). */
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus>;
  /** Valida a assinatura do webhook conforme a documentação oficial. */
  verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean>;
  /** Extrai um evento tipado a partir do corpo do webhook. */
  parseWebhookEvent(rawBody: string): WebhookEvent;
}
