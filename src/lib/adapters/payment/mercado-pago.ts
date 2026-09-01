import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  WebhookEvent,
  WebhookSignatureInput,
} from "./types";
import type { PaymentStatus } from "@/lib/domain/enums";

// Provedor Mercado Pago (seções 6, 14). Requer MERCADO_PAGO_ACCESS_TOKEN e
// MERCADO_PAGO_WEBHOOK_SECRET. Sem credenciais, `createPayment` falha com erro
// claro — nunca "simula" sucesso de integração real.
//
// A assinatura do webhook segue o padrão oficial: `x-signature` contém `ts` e
// `v1`, e o HMAC SHA-256 é calculado sobre o manifesto formado por `data.id`,
// `x-request-id` e `ts`. Ver docs/PAYMENTS.md.

const API_BASE = "https://api.mercadopago.com";

interface ParsedWebhookSignature {
  timestamp: string;
  digest: Buffer;
}

/** Converte somente os formatos de ID representáveis no manifesto oficial. */
export function parseMercadoPagoDataId(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const dataId = String(value).trim();
  return dataId.length > 0 ? dataId : null;
}

export function extractMercadoPagoDataId(rawBody: string): string | null {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const data = (parsed as Record<string, unknown>).data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return parseMercadoPagoDataId((data as Record<string, unknown>).id);
  } catch {
    return null;
  }
}

function parseWebhookSignature(value: string): ParsedWebhookSignature | null {
  let timestamp: string | undefined;
  let signatureHex: string | undefined;

  for (const rawPart of value.split(",")) {
    const part = rawPart.trim();
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0 || separatorIndex === part.length - 1) return null;

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const partValue = part.slice(separatorIndex + 1).trim();
    if (!key || !partValue) return null;

    if (key === "ts") {
      if (timestamp !== undefined) return null;
      timestamp = partValue;
    } else if (key === "v1") {
      if (signatureHex !== undefined) return null;
      signatureHex = partValue;
    }
  }

  if (!timestamp || !/^\d{1,20}$/.test(timestamp)) return null;
  if (!signatureHex || !/^[a-f\d]{64}$/i.test(signatureHex)) return null;

  return {
    timestamp,
    digest: Buffer.from(signatureHex, "hex"),
  };
}

function webhookManifest(dataId: string, requestId: string, timestamp: string): string {
  return `id:${dataId};request-id:${requestId};ts:${timestamp};`;
}

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
    const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago`;

    let body: Record<string, unknown>;
    if (input.method === "CARD") {
      if (!input.card) {
        throw new Error("[mercado_pago] dados do cartão (token) ausentes na criação do pagamento.");
      }
      body = {
        transaction_amount: input.amountCents / 100,
        description: input.description,
        token: input.card.token,
        installments: input.card.installments,
        payment_method_id: input.card.paymentMethodId,
        issuer_id: input.card.issuerId,
        payer: {
          email: input.payer.email,
          first_name: input.payer.name,
          identification:
            input.payer.identificationType && input.payer.identificationNumber
              ? {
                  type: input.payer.identificationType,
                  number: input.payer.identificationNumber,
                }
              : undefined,
        },
        external_reference: input.orderId,
        notification_url: notificationUrl,
      };
    } else {
      body = {
        transaction_amount: input.amountCents / 100,
        description: input.description,
        payment_method_id: "pix",
        payer: { email: input.payer.email, first_name: input.payer.name },
        external_reference: input.orderId,
        notification_url: notificationUrl,
      };
    }

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
    if (input.method === "PIX" && pointOfInteraction?.transaction_data) {
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

  async verifyWebhookSignature(input: WebhookSignatureInput): Promise<boolean> {
    const signatureHeader = input.headers.get("x-signature");
    const requestId = input.headers.get("x-request-id")?.trim();
    if (!signatureHeader || !requestId || !this.webhookSecret) return false;

    const signature = parseWebhookSignature(signatureHeader);
    const dataId = parseMercadoPagoDataId(input.dataId) ?? extractMercadoPagoDataId(input.rawBody);
    if (!signature || !dataId) return false;

    // Desde o SDK Node 3.2.0 o Mercado Pago preserva o case original do ID.
    // O segundo manifesto mantém compatibilidade com notificações antigas nas
    // quais IDs alfanuméricos recebidos pela URL eram normalizados para lowercase.
    const candidateIds = [dataId];
    const lowercaseDataId = dataId.toLowerCase();
    if (lowercaseDataId !== dataId) candidateIds.push(lowercaseDataId);

    let verified = false;
    for (const candidateId of candidateIds) {
      const expected = createHmac("sha256", this.webhookSecret)
        .update(webhookManifest(candidateId, requestId, signature.timestamp))
        .digest();
      const matches =
        expected.length === signature.digest.length && timingSafeEqual(expected, signature.digest);
      verified = matches || verified;
    }
    return verified;
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
