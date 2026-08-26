import type {
  NfcTagStatus,
  PaymentStatus,
  PhysicalOrderStatus,
  ProjectStatus,
} from "./enums";

// Transições de estado permitidas (seção 21). O backend NÃO aceita qualquer
// mudança arbitrária: toda transição deve constar no grafo abaixo.

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["EXPIRED", "ARCHIVED", "BLOCKED"],
  EXPIRED: ["PUBLISHED", "ARCHIVED"],
  BLOCKED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: [],
  CANCELLED: [],
};

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  CREATED: ["PENDING", "CANCELLED"],
  PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["REFUNDED", "CHARGEDBACK"],
  REJECTED: [],
  CANCELLED: [],
  REFUNDED: [],
  CHARGEDBACK: [],
};

export const PHYSICAL_ORDER_TRANSITIONS: Record<PhysicalOrderStatus, PhysicalOrderStatus[]> = {
  WAITING_PAYMENT: ["QUEUED", "CANCELLED"],
  QUEUED: ["PRINTING", "CANCELLED"],
  PRINTING: ["ASSEMBLY", "CANCELLED"],
  ASSEMBLY: ["NFC_WRITING", "QUALITY_CHECK", "CANCELLED"],
  NFC_WRITING: ["QUALITY_CHECK", "CANCELLED"],
  QUALITY_CHECK: ["PACKED", "ASSEMBLY", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};

export const NFC_TAG_TRANSITIONS: Record<NfcTagStatus, NfcTagStatus[]> = {
  GENERATED: ["WRITTEN", "DISABLED"],
  WRITTEN: ["TESTED", "DISABLED"],
  TESTED: ["PACKED", "DISABLED"],
  PACKED: ["SHIPPED", "DISABLED"],
  SHIPPED: ["ACTIVE", "DISABLED"],
  ACTIVE: ["DISABLED"],
  DISABLED: [],
};

export type StateMachineKind = "project" | "payment" | "physicalOrder" | "nfcTag";

function graphFor(kind: StateMachineKind): Record<string, string[]> {
  switch (kind) {
    case "project":
      return PROJECT_TRANSITIONS as Record<string, string[]>;
    case "payment":
      return PAYMENT_TRANSITIONS as Record<string, string[]>;
    case "physicalOrder":
      return PHYSICAL_ORDER_TRANSITIONS as Record<string, string[]>;
    case "nfcTag":
      return NFC_TAG_TRANSITIONS as Record<string, string[]>;
  }
}

/** Retorna true se a transição `from -> to` é permitida. */
export function canTransition(kind: StateMachineKind, from: string, to: string): boolean {
  const graph = graphFor(kind);
  const allowed = graph[from];
  return allowed != null && allowed.includes(to);
}

/** Lança erro se a transição não for permitida. */
export function assertTransition(kind: StateMachineKind, from: string, to: string): void {
  if (!canTransition(kind, from, to)) {
    throw new Error(`[state] Transição inválida de "${kind}": ${from} -> ${to}`);
  }
}

/** Regra específica: pedido físico com NFC só pode ser "PACKED" se a tag foi testada. */
export function canPackPhysicalOrder(tagStatus: NfcTagStatus | null): boolean {
  // Sem NFC (plano digital) não há restrição. Com NFC, exige TESTED ou além.
  if (tagStatus == null) return true;
  const tested = ["TESTED", "PACKED", "SHIPPED", "ACTIVE"];
  return tested.includes(tagStatus);
}
