import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieStore = { get: vi.fn(), set: vi.fn() };
  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore),
    createOrderFromDraft: vi.fn(),
    initiatePayment: vi.fn(),
    getPendingPaymentSnapshot: vi.fn(),
    processPaymentApproved: vi.fn(),
    processPaymentFailed: vi.fn(),
    findPayment: vi.fn(),
  };
});

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));

vi.mock("@/lib/db", () => ({
  prisma: {
    payment: { findFirst: mocks.findPayment },
  },
}));

vi.mock("@/lib/server/orders", () => ({
  createOrderFromDraft: mocks.createOrderFromDraft,
  initiatePayment: mocks.initiatePayment,
  getPendingPaymentSnapshot: mocks.getPendingPaymentSnapshot,
  processPaymentApproved: mocks.processPaymentApproved,
  processPaymentFailed: mocks.processPaymentFailed,
}));

import { approveOrderPayment, getOrderPaymentStatus, startCheckout } from "./checkout";

const orderId = "11111111-1111-4111-8111-111111111111";
const draftToken = "draft-token-with-more-than-twenty-chars";
const cookieName = `pv_pix_${orderId}`;
const pix = {
  qrCode: "00020126PIX-EXATO-DO-PROVEDOR",
  qrCodeBase64: "base64-do-qr-code",
  expiresAt: "2026-08-29T18:30:00.000Z",
};

describe("acesso ao pagamento pendente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieStore.set.mockReset();
    mocks.cookieStore.get.mockReset();
    mocks.cookieStore.get.mockReturnValue(undefined);
  });

  it("cria uma capacidade HttpOnly quando o checkout retorna Pix pendente", async () => {
    mocks.createOrderFromDraft.mockResolvedValue({ paymentId: "payment-id" });
    mocks.initiatePayment.mockResolvedValue({
      status: "PENDING",
      redirect: "pendente",
      orderId,
      pix,
    });

    await expect(
      startCheckout({
        draftToken,
        planSlug: "momento",
        email: "cliente@example.com",
        name: "Cliente",
        method: "PIX",
        acceptedTerms: true,
      }),
    ).resolves.toEqual({ redirect: "pendente", orderId, pix });

    expect(mocks.cookieStore.set).toHaveBeenCalledWith(cookieName, draftToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/pagamento",
      maxAge: 86_400,
    });
  });

  it("não cancela uma cobrança já criada se o navegador rejeitar o cookie", async () => {
    mocks.createOrderFromDraft.mockResolvedValue({ paymentId: "payment-id" });
    mocks.initiatePayment.mockResolvedValue({
      status: "PENDING",
      redirect: "pendente",
      orderId,
      pix,
    });
    mocks.cookieStore.set.mockImplementationOnce(() => {
      throw new Error("cookies unavailable");
    });

    await expect(
      startCheckout({
        draftToken,
        planSlug: "momento",
        email: "cliente@example.com",
        name: "Cliente",
        method: "PIX",
        acceptedTerms: true,
      }),
    ).resolves.toEqual({ redirect: "pendente", orderId, pix });
    expect(mocks.processPaymentFailed).not.toHaveBeenCalled();
  });

  it("recupera o Pix pelo cookie sem devolver o token ao cliente", async () => {
    mocks.cookieStore.get.mockReturnValue({ value: draftToken });
    mocks.getPendingPaymentSnapshot.mockResolvedValue({ status: "pending", pix });

    await expect(getOrderPaymentStatus(orderId, true)).resolves.toEqual({ status: "pending", pix });
    expect(mocks.cookieStore.get).toHaveBeenCalledWith(cookieName);
    expect(mocks.getPendingPaymentSnapshot).toHaveBeenCalledWith(orderId, draftToken);
  });

  it("omite o payload pesado do Pix nas consultas periódicas", async () => {
    mocks.cookieStore.get.mockReturnValue({ value: draftToken });
    mocks.getPendingPaymentSnapshot.mockResolvedValue({ status: "pending", pix });

    await expect(getOrderPaymentStatus(orderId)).resolves.toEqual({
      status: "pending",
      pix: null,
    });
  });

  it("não revela status nem Pix quando o cookie seguro está ausente", async () => {
    await expect(getOrderPaymentStatus(orderId)).resolves.toEqual({
      status: "unavailable",
      pix: null,
    });
    expect(mocks.getPendingPaymentSnapshot).not.toHaveBeenCalled();
  });

  it("expira o cookie de acesso depois de um estado terminal", async () => {
    mocks.cookieStore.get.mockReturnValue({ value: draftToken });
    mocks.getPendingPaymentSnapshot.mockResolvedValue({ status: "approved", pix: null });

    await expect(getOrderPaymentStatus(orderId)).resolves.toEqual({
      status: "approved",
      pix: null,
    });
    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      cookieName,
      "",
      expect.objectContaining({ path: "/pagamento", maxAge: 0 }),
    );
  });

  it("bloqueia até a aprovação fake quando a capacidade não pertence ao pedido", async () => {
    await expect(approveOrderPayment(orderId)).rejects.toThrow(
      "Acesso ao pagamento não autorizado",
    );
    expect(mocks.findPayment).not.toHaveBeenCalled();
    expect(mocks.processPaymentApproved).not.toHaveBeenCalled();
  });
});
