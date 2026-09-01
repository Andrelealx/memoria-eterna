import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  parseWebhookEvent: vi.fn(),
  getPaymentStatus: vi.fn(),
  findPayment: vi.fn(),
  processPaymentApproved: vi.fn(),
  processPaymentFailed: vi.fn(),
}));

vi.mock("@/lib/adapters/payment", () => ({
  getPaymentProvider: () => ({
    name: "mercado_pago",
    verifyWebhookSignature: mocks.verifyWebhookSignature,
    parseWebhookEvent: mocks.parseWebhookEvent,
    getPaymentStatus: mocks.getPaymentStatus,
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    payment: {
      findUnique: mocks.findPayment,
    },
  },
}));

vi.mock("@/lib/server/orders", () => ({
  processPaymentApproved: mocks.processPaymentApproved,
  processPaymentFailed: mocks.processPaymentFailed,
}));

import { POST } from "./route";

function webhookRequest(dataId: string, queryDataId?: string): Request {
  const url = new URL("https://example.test/api/webhooks/mercado-pago");
  if (queryDataId !== undefined) url.searchParams.set("data.id", queryDataId);
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "request-123",
      "x-signature": "ts=1788134400000,v1=placeholder",
    },
    body: JSON.stringify({ id: 555, type: "payment", data: { id: dataId } }),
  });
}

describe("POST /api/webhooks/mercado-pago", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyWebhookSignature.mockResolvedValue(true);
    mocks.parseWebhookEvent.mockImplementation((rawBody: string) => {
      const raw = JSON.parse(rawBody) as Record<string, unknown>;
      return { providerEventId: String(raw.id), type: String(raw.type), raw };
    });
    mocks.findPayment.mockResolvedValue({ id: "payment-db-id" });
    mocks.getPaymentStatus.mockResolvedValue("APPROVED");
  });

  it("prioriza data.id da query oficial e processa o mesmo recurso autenticado", async () => {
    const response = await POST(webhookRequest("PaymentABC", "PaymentABC"));

    expect(response.status).toBe(200);
    expect(mocks.verifyWebhookSignature).toHaveBeenCalledWith(
      expect.objectContaining({ dataId: "PaymentABC" }),
    );
    expect(mocks.findPayment).toHaveBeenCalledWith({
      where: { providerPaymentId: "PaymentABC" },
    });
    expect(mocks.processPaymentApproved).toHaveBeenCalledWith("payment-db-id", "555");
  });

  it("usa data.id do payload quando a query não existe", async () => {
    const response = await POST(webhookRequest("123456789"));

    expect(response.status).toBe(200);
    expect(mocks.verifyWebhookSignature).toHaveBeenCalledWith(
      expect.objectContaining({ dataId: "123456789" }),
    );
    expect(mocks.findPayment).toHaveBeenCalledWith({
      where: { providerPaymentId: "123456789" },
    });
  });

  it("aceita diferença apenas de case entre URL e payload para compatibilidade legada", async () => {
    const response = await POST(webhookRequest("OrderABC", "orderabc"));

    expect(response.status).toBe(200);
    expect(mocks.verifyWebhookSignature).toHaveBeenCalledWith(
      expect.objectContaining({ dataId: "orderabc" }),
    );
    expect(mocks.findPayment).toHaveBeenCalledWith({
      where: { providerPaymentId: "OrderABC" },
    });
  });

  it("rejeita quando query e payload apontam para recursos diferentes", async () => {
    const response = await POST(webhookRequest("payment-2", "payment-1"));

    expect(response.status).toBe(401);
    expect(mocks.verifyWebhookSignature).not.toHaveBeenCalled();
    expect(mocks.findPayment).not.toHaveBeenCalled();
  });

  it("interrompe o processamento quando a assinatura é inválida", async () => {
    mocks.verifyWebhookSignature.mockResolvedValue(false);

    const response = await POST(webhookRequest("123456789", "123456789"));

    expect(response.status).toBe(401);
    expect(mocks.findPayment).not.toHaveBeenCalled();
    expect(mocks.getPaymentStatus).not.toHaveBeenCalled();
  });

  it("responde 400 para JSON malformado sem consultar o banco", async () => {
    const response = await POST(
      new Request("https://example.test/api/webhooks/mercado-pago?data.id=123", {
        method: "POST",
        body: "{invalid",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.verifyWebhookSignature).not.toHaveBeenCalled();
    expect(mocks.findPayment).not.toHaveBeenCalled();
  });
});
