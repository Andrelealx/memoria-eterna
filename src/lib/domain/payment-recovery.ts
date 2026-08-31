import type { OrderStatus, PaymentStatus, ProjectStatus } from "./enums";

export type RecoverablePaymentFailure = Extract<PaymentStatus, "REJECTED" | "CANCELLED">;

export function isRecoverablePaymentFailure(
  status: PaymentStatus,
): status is RecoverablePaymentFailure {
  return status === "REJECTED" || status === "CANCELLED";
}

export function shouldReopenDraftAfterPaymentFailure(input: {
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  projectStatus: ProjectStatus;
  hasAnotherActiveOrder: boolean;
}): boolean {
  return (
    isRecoverablePaymentFailure(input.paymentStatus) &&
    ["CREATED", "AWAITING_PAYMENT", "CANCELLED"].includes(input.orderStatus) &&
    input.projectStatus === "AWAITING_PAYMENT" &&
    !input.hasAnotherActiveOrder
  );
}
