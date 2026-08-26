import { randomUUID } from "node:crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  WebhookEvent,
} from "./types";
import type { PaymentStatus } from "@/lib/domain/enums";

// Provedor FAKE de pagamento — SOMENTE desenvolvimento (seção 14).
// Nunca disponível em produção (guard em `src/lib/env.ts` / factory).
// Não representa integração real; serve para exercitar os fluxos localmente.

const memory = new Map<string, PaymentStatus>();

export class FakePaymentProvider implements PaymentProvider {
  readonly name = "fake";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const providerPaymentId = `fake_${randomUUID()}`;
    // PIX fica pendente; cartão é aprovado imediatamente no fluxo fake.
    const status: PaymentStatus = input.method === "PIX" ? "PENDING" : "APPROVED";
    memory.set(providerPaymentId, status);
    memory.set(input.idempotencyKey, status);

    if (input.method === "PIX") {
      return {
        providerPaymentId,
        status,
        pix: {
          qrCode: "00020126DEV-FAKE-PIX-COPIA-E-COLA",
          qrCodeBase64: "data:image/png;base64,DEV",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      };
    }
    return { providerPaymentId, status };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus> {
    return memory.get(providerPaymentId) ?? "PENDING";
  }

  /** Aprova manualmente um PIX pendente (útil no fluxo de desenvolvimento). */
  async approve(providerPaymentId: string): Promise<void> {
    memory.set(providerPaymentId, "APPROVED");
  }

  async verifyWebhookSignature(): Promise<boolean> {
    return true; // fake: sem assinatura
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    return {
      providerEventId: (parsed.id as string) ?? randomUUID(),
      type: (parsed.type as string) ?? "payment.updated",
      raw: parsed,
    };
  }
}
