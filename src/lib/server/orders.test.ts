import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const tx = {
    payment: { findUnique: vi.fn(), update: vi.fn() },
    order: { updateMany: vi.fn(), findFirst: vi.fn() },
    physicalOrder: { updateMany: vi.fn() },
    couponRedemption: { deleteMany: vi.fn() },
    project: { updateMany: vi.fn() },
  };
  return {
    tx,
    transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    payment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
});

const paymentProvider = vi.hoisted(() => ({
  createPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: db.transaction, payment: db.payment },
}));

vi.mock("@/lib/adapters/payment", () => ({
  getPaymentProvider: () => paymentProvider,
}));

import { getPendingPaymentSnapshot, initiatePayment, processPaymentFailed } from "./orders";

function pendingPayment() {
  return {
    id: "payment-id",
    orderId: "order-id",
    status: "PENDING",
    order: {
      id: "order-id",
      status: "AWAITING_PAYMENT",
      project: { id: "project-id", status: "AWAITING_PAYMENT" },
    },
  };
}

describe("processPaymentFailed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.tx.payment.findUnique.mockResolvedValue(pendingPayment());
    db.tx.order.findFirst.mockResolvedValue(null);
    db.tx.project.updateMany.mockResolvedValue({ count: 1 });
  });

  it("encerra a tentativa e devolve o projeto ao rascunho", async () => {
    await expect(processPaymentFailed("payment-id", "REJECTED")).resolves.toEqual({
      ok: true,
      reopened: true,
    });

    expect(db.tx.payment.update).toHaveBeenCalledWith({
      where: { id: "payment-id" },
      data: { status: "REJECTED" },
    });
    expect(db.tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: "order-id", status: { in: ["CREATED", "AWAITING_PAYMENT"] } },
      data: { status: "CANCELLED" },
    });
    expect(db.tx.physicalOrder.updateMany).toHaveBeenCalled();
    expect(db.tx.couponRedemption.deleteMany).toHaveBeenCalledWith({
      where: { orderId: "order-id" },
    });
    expect(db.tx.project.updateMany).toHaveBeenCalledWith({
      where: { id: "project-id", status: "AWAITING_PAYMENT" },
      data: { status: "DRAFT" },
    });
  });

  it("não reabre o projeto quando já existe outra tentativa ativa", async () => {
    db.tx.order.findFirst.mockResolvedValue({ id: "new-order-id" });

    await expect(processPaymentFailed("payment-id", "CANCELLED")).resolves.toEqual({
      ok: true,
      reopened: false,
    });

    expect(db.tx.project.updateMany).not.toHaveBeenCalled();
  });

  it("nunca rebaixa um pagamento já aprovado", async () => {
    db.tx.payment.findUnique.mockResolvedValue({
      ...pendingPayment(),
      status: "APPROVED",
      order: { ...pendingPayment().order, status: "PAID" },
    });

    await expect(processPaymentFailed("payment-id", "REJECTED")).resolves.toEqual({
      ok: true,
      reopened: false,
    });

    expect(db.tx.payment.update).not.toHaveBeenCalled();
    expect(db.tx.order.updateMany).not.toHaveBeenCalled();
    expect(db.tx.project.updateMany).not.toHaveBeenCalled();
  });
});

describe("getPendingPaymentSnapshot", () => {
  const orderId = "11111111-1111-4111-8111-111111111111";
  const draftToken = "draft-token-with-more-than-twenty-chars";
  const pix = {
    qrCode: "00020126PIX-EXATO-DO-PROVEDOR",
    qrCodeBase64: "base64-do-qr-code",
    expiresAt: "2026-08-29T18:30:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    db.payment.findFirst.mockResolvedValue({
      status: "PENDING",
      method: "PIX",
      sanitizedPayload: { version: 1, type: "pix", pix },
      order: { project: { draftToken } },
    });
  });

  it("recupera somente o DTO Pix persistido para o token correto", async () => {
    await expect(getPendingPaymentSnapshot(orderId, draftToken)).resolves.toEqual({
      status: "pending",
      pix,
    });
    expect(db.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderId } }),
    );
  });

  it("não expõe o Pix quando o token secreto não pertence ao pedido", async () => {
    await expect(
      getPendingPaymentSnapshot(orderId, "another-secret-token-with-enough-length"),
    ).resolves.toBeNull();
  });

  it("não inventa um Pix quando o payload antigo ou inválido não contém os dados", async () => {
    db.payment.findFirst.mockResolvedValue({
      status: "PENDING",
      method: "PIX",
      sanitizedPayload: { pix: true },
      order: { project: { draftToken } },
    });

    await expect(getPendingPaymentSnapshot(orderId, draftToken)).resolves.toEqual({
      status: "pending",
      pix: null,
    });
  });

  it("não consulta o banco para identificadores inválidos", async () => {
    await expect(getPendingPaymentSnapshot("not-an-order", draftToken)).resolves.toBeNull();
    expect(db.payment.findFirst).not.toHaveBeenCalled();
  });

  // Regressão do pedido PV-2026-000004: o webhook do provedor nunca chegou e o
  // pedido ficou preso em "aguardando pagamento" mesmo já pago, porque a tela
  // só relia o banco local. A consulta precisa chegar até o provedor.
  it("pergunta o status ao provedor quando o pagamento ainda está pendente aqui", async () => {
    db.payment.findFirst.mockResolvedValue({
      id: "payment-id",
      status: "PENDING",
      method: "PIX",
      providerPaymentId: "177171554468",
      sanitizedPayload: { version: 1, type: "pix", pix },
      order: { project: { draftToken } },
    });
    paymentProvider.getPaymentStatus.mockResolvedValue("PENDING");

    await expect(getPendingPaymentSnapshot(orderId, draftToken)).resolves.toEqual({
      status: "pending",
      pix,
    });
    expect(paymentProvider.getPaymentStatus).toHaveBeenCalledWith("177171554468");
  });

  it("mantém a tela de pé quando a consulta ao provedor falha", async () => {
    db.payment.findFirst.mockResolvedValue({
      id: "payment-id",
      status: "PENDING",
      method: "PIX",
      providerPaymentId: "999999999999",
      sanitizedPayload: { version: 1, type: "pix", pix },
      order: { project: { draftToken } },
    });
    paymentProvider.getPaymentStatus.mockRejectedValue(new Error("provedor fora do ar"));

    await expect(getPendingPaymentSnapshot(orderId, draftToken)).resolves.toEqual({
      status: "pending",
      pix,
    });
  });
});

describe("initiatePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persiste o Pix normalizado para permitir retomada server-side", async () => {
    const pix = {
      qrCode: "00020126PIX-EXATO-DO-PROVEDOR",
      qrCodeBase64: "base64-do-qr-code",
      expiresAt: "2026-08-29T18:30:00.000Z",
    };
    db.payment.findUnique.mockResolvedValue({
      id: "payment-id",
      orderId: "11111111-1111-4111-8111-111111111111",
      amount: 5990,
      idempotencyKey: "pay-idempotency",
      order: { orderNumber: "PV-2026-000001" },
    });
    paymentProvider.createPayment.mockResolvedValue({
      providerPaymentId: "provider-payment-id",
      status: "PENDING",
      pix,
    });

    await expect(
      initiatePayment("payment-id", "PIX", "cliente@example.com", "Cliente"),
    ).resolves.toEqual({
      status: "PENDING",
      redirect: "pendente",
      orderId: "11111111-1111-4111-8111-111111111111",
      pix,
    });
    expect(db.payment.update).toHaveBeenCalledWith({
      where: { id: "payment-id" },
      data: {
        providerPaymentId: "provider-payment-id",
        method: "PIX",
        status: "PENDING",
        sanitizedPayload: { version: 1, type: "pix", pix },
      },
    });
  });
});
