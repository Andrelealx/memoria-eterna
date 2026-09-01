import type { PaymentMethod, PaymentStatus } from "@/lib/domain/enums";

// Contrato do provedor de pagamento (seções 6, 14). Preparado para Mercado Pago
// e, futuramente, Stripe. O sistema opera em BRL (centavos inteiros).

export interface PayerInfo {
  email: string;
  name?: string;
  identificationType?: string;
  identificationNumber?: string;
}

/** Cartão já tokenizado no navegador (Card Form) — nunca dados brutos. */
export interface CardPaymentDetails {
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
}

export interface CreatePaymentInput {
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
  idempotencyKey: string;
  payer: PayerInfo;
  description: string;
  card?: CardPaymentDetails;
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

export interface WebhookSignatureInput {
  headers: Headers;
  rawBody: string;
  /** ID do recurso recebido na query string; o provedor pode usar o payload como fallback. */
  dataId?: string | null;
}

export interface PaymentDetails {
  status: PaymentStatus;
  /** external_reference enviado na criação — nosso Order.id. */
  externalReference: string | null;
}

export interface PaymentProvider {
  readonly name: string;
  /** Cria uma intenção de pagamento no provedor. */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Consulta o status atual no provedor (fonte da verdade). */
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus>;
  /**
   * Detalhes completos de um pagamento, incluindo a external_reference.
   * Necessário para reconciliar o Checkout Pro: o webhook chega com o ID do
   * pagamento real, mas salvamos o ID da preferência ao criar a cobrança.
   */
  getPaymentDetails(providerPaymentId: string): Promise<PaymentDetails | null>;
  /** Valida a assinatura do webhook conforme a documentação oficial. */
  verifyWebhookSignature(input: WebhookSignatureInput): Promise<boolean>;
  /** Extrai um evento tipado a partir do corpo do webhook. */
  parseWebhookEvent(rawBody: string): WebhookEvent;
}
