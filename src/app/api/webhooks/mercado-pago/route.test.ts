import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  parseWebhookEvent: vi.fn(),
  getPaymentStatus: vi.fn(),
  getPaymentDetails: vi.fn(),
  findPayment: vi.fn(),
  findFirstPayment: vi.fn(),
  updatePayment: vi.fn(),
  processPaymentApproved: vi.fn(),
  processPaymentFailed: vi.fn(),
}));

vi.mock("@/lib/adapters/payment", () => ({
  getPaymentProvider: () => ({
    name: "mercado_pago",
    verifyWebhookSignature: mocks.verifyWebhookSignature,
    parseWebhookEvent: mocks.parseWebhookEvent,
    getPaymentStatus: mocks.getPaymentStatus,
    getPaymentDetails: mocks.getPaymentDetails,
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    payment: {
      findUnique: mocks.findPayment,
      findFirst: mocks.findFirstPayment,
      update: mocks.updatePayment,
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

  describe("Checkout Pro (reconciliação por external_reference)", () => {
    // O evento traz o ID do pagamento real, mas o Payment foi salvo com o ID
    // da preferência (só existe ao criar a cobrança) — por isso a busca direta
    // por providerPaymentId não acha nada e precisa cair no fallback.
    beforeEach(() => {
      mocks.findPayment.mockResolvedValue(null);
    });

    it("acha o pedido pela external_reference, reconcilia o ID e processa", async () => {
      mocks.getPaymentDetails.mockResolvedValue({
        status: "APPROVED",
        externalReference: "order-abc",
      });
      mocks.findFirstPayment.mockResolvedValue({ id: "payment-db-id", orderId: "order-abc" });

      const response = await POST(webhookRequest("real-payment-id", "real-payment-id"));

      expect(response.status).toBe(200);
      expect(mocks.getPaymentDetails).toHaveBeenCalledWith("real-payment-id");
      expect(mocks.findFirstPayment).toHaveBeenCalledWith({ where: { orderId: "order-abc" } });
      expect(mocks.updatePayment).toHaveBeenCalledWith({
        where: { id: "payment-db-id" },
        data: { providerPaymentId: "real-payment-id" },
      });
      expect(mocks.processPaymentApproved).toHaveBeenCalledWith("payment-db-id", "555");
    });

    it("responde 404 sem vazar existência quando não há external_reference", async () => {
      mocks.getPaymentDetails.mockResolvedValue(null);

      const response = await POST(webhookRequest("unknown-id", "unknown-id"));

      expect(response.status).toBe(404);
      expect(mocks.findFirstPayment).not.toHaveBeenCalled();
      expect(mocks.processPaymentApproved).not.toHaveBeenCalled();
    });

    it("responde 404 quando a external_reference não corresponde a nenhum pedido", async () => {
      mocks.getPaymentDetails.mockResolvedValue({
        status: "APPROVED",
        externalReference: "order-inexistente",
      });
      mocks.findFirstPayment.mockResolvedValue(null);

      const response = await POST(webhookRequest("real-payment-id", "real-payment-id"));

      expect(response.status).toBe(404);
      expect(mocks.updatePayment).not.toHaveBeenCalled();
      expect(mocks.processPaymentApproved).not.toHaveBeenCalled();
    });
  });
});
