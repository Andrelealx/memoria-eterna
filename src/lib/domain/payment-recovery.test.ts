import { describe, expect, it } from "vitest";
import {
  isRecoverablePaymentFailure,
  shouldReopenDraftAfterPaymentFailure,
} from "./payment-recovery";

describe("payment recovery", () => {
  it("trata recusa e cancelamento como falhas recuperáveis", () => {
    expect(isRecoverablePaymentFailure("REJECTED")).toBe(true);
    expect(isRecoverablePaymentFailure("CANCELLED")).toBe(true);
    expect(isRecoverablePaymentFailure("APPROVED")).toBe(false);
    expect(isRecoverablePaymentFailure("REFUNDED")).toBe(false);
  });

  it("reabre somente o projeto que ficou aguardando um pagamento encerrado", () => {
    expect(
      shouldReopenDraftAfterPaymentFailure({
        paymentStatus: "REJECTED",
        orderStatus: "AWAITING_PAYMENT",
        projectStatus: "AWAITING_PAYMENT",
        hasAnotherActiveOrder: false,
      }),
    ).toBe(true);

    expect(
      shouldReopenDraftAfterPaymentFailure({
        paymentStatus: "REJECTED",
        orderStatus: "PAID",
        projectStatus: "AWAITING_PAYMENT",
        hasAnotherActiveOrder: false,
      }),
    ).toBe(false);
    expect(
      shouldReopenDraftAfterPaymentFailure({
        paymentStatus: "CANCELLED",
        orderStatus: "REFUNDED",
        projectStatus: "AWAITING_PAYMENT",
        hasAnotherActiveOrder: false,
      }),
    ).toBe(false);
    expect(
      shouldReopenDraftAfterPaymentFailure({
        paymentStatus: "REJECTED",
        orderStatus: "AWAITING_PAYMENT",
        projectStatus: "PUBLISHED",
        hasAnotherActiveOrder: false,
      }),
    ).toBe(false);
  });

  it("não deixa um webhook antigo interromper uma nova tentativa", () => {
    expect(
      shouldReopenDraftAfterPaymentFailure({
        paymentStatus: "CANCELLED",
        orderStatus: "AWAITING_PAYMENT",
        projectStatus: "AWAITING_PAYMENT",
        hasAnotherActiveOrder: true,
      }),
    ).toBe(false);
  });
});
