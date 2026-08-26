import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  WebhookEvent,
} from "./types";
import type { PaymentStatus } from "@/lib/domain/enums";

// Provedor Mercado Pago (seções 6, 14). Requer MERCADO_PAGO_ACCESS_TOKEN e
// MERCADO_PAGO_WEBHOOK_SECRET. Sem credenciais, `createPayment` falha com erro
// claro — nunca "simula" sucesso de integração real.
//
// A assinatura do webhook segue o padrão oficial: header `x-signature` = HMAC
// SHA-256 do corpo bruto usando `MERCADO_PAGO_WEBHOOK_SECRET`, comparado de
// forma constante (timing-safe). Ver docs/PAYMENTS.md.

const API_BASE = "https://api.mercadopago.com";

function mapStatus(mpStatus: string): PaymentStatus {
  switch (mpStatus) {
    case "approved":
      return "APPROVED";
    case "pending":
    case "in_process":
    case "authorized":
      return "PENDING";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    case "refunded":
      return "REFUNDED";
    case "charged_back":
      return "CHARGEDBACK";
    default:
      return "PENDING";
  }
}

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercado_pago";

  constructor(
    private readonly accessToken: string,
    private readonly webhookSecret?: string,
  ) {}

  private requireCredentials(): string {
    if (!this.accessToken) {
      throw new Error(
        "[mercado_pago] MERCADO_PAGO_ACCESS_TOKEN ausente. Configure a credencial (sandbox ou produção).",
      );
    }
    return this.accessToken;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const token = this.requireCredentials();
    const method = input.method === "PIX" ? "pix" : "credit_card";
    const body = {
      transaction_amount: input.amountCents / 100,
      description: input.description,
      payment_method_id: method,
      payer: { email: input.payer.email, first_name: input.payer.name },
      external_reference: input.orderId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago`,
    };

    const res = await fetch(`${API_BASE}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[mercado_pago] falha ao criar pagamento (${res.status}): ${text}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const providerPaymentId = String(data.id);
    const status = mapStatus(String(data.status));
    const result: CreatePaymentResult = { providerPaymentId, status };

    const pointOfInteraction = data.point_of_interaction as
      | { transaction_data?: { qr_code?: string; qr_code_base64?: string } }
      | undefined;
    if (method === "pix" && pointOfInteraction?.transaction_data) {
      const td = pointOfInteraction.transaction_data;
      result.pix = {
        qrCode: td.qr_code ?? "",
        qrCodeBase64: td.qr_code_base64 ?? "",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    }

    return result;
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus> {
    const token = this.requireCredentials();
    const res = await fetch(`${API_BASE}/v1/payments/${providerPaymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`[mercado_pago] falha ao consultar pagamento (${res.status})`);
    const data = (await res.json()) as { status?: string };
    return mapStatus(data.status ?? "pending");
  }

  async verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
    const signature = headers.get("x-signature");
    const requestId = headers.get("x-request-id");
    if (!signature || !requestId || !this.webhookSecret) return false;
    const expected = createHmac("sha256", this.webhookSecret)
      .update(`${requestId}.${rawBody}`)
      .digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    return {
      providerEventId: String(parsed.id ?? ""),
      type: String(parsed.type ?? "payment"),
      raw: parsed,
    };
  }
}
