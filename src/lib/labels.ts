// Rótulos pt-BR para estados (UI). Os valores canônicos ficam em domain/enums.ts.

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PROCESSING: "Processando",
  PUBLISHED: "Publicado",
  EXPIRED: "Expirado",
  ARCHIVED: "Arquivado",
  BLOCKED: "Bloqueado",
  CANCELLED: "Cancelado",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  CREATED: "Criado",
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  CHARGEDBACK: "Chargeback",
};

export const PHYSICAL_ORDER_LABELS: Record<string, string> = {
  WAITING_PAYMENT: "Aguardando pagamento",
  QUEUED: "Na fila",
  PRINTING: "Impressão",
  ASSEMBLY: "Montagem",
  NFC_WRITING: "Gravação NFC",
  QUALITY_CHECK: "Controle de qualidade",
  PACKED: "Embalado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  RETURNED: "Devolvido",
  CANCELLED: "Cancelado",
};

export const NFC_TAG_LABELS: Record<string, string> = {
  GENERATED: "Gerada",
  WRITTEN: "Gravada",
  TESTED: "Testada",
  PACKED: "Embalada",
  SHIPPED: "Enviada",
  ACTIVE: "Ativa",
  DISABLED: "Desativada",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberta",
  REVIEWING: "Em análise",
  RESOLVED: "Resolvida",
  DISMISSED: "Descartada",
};

export const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Cliente",
  OPERATOR: "Operador",
  ADMIN: "Admin",
};

export function formatDate(iso: Date | string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Variante de badge por estado (cores semânticas). Centraliza o mapeamento
// para que listas de admin/painel exibam estados com cores consistentes.
export type StatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "error"
  | "muted";

const STATUS_VARIANT: Record<string, StatusVariant> = {
  // Concluído / positivo
  PUBLISHED: "success",
  APPROVED: "success",
  DELIVERED: "success",
  ACTIVE: "success",
  TESTED: "success",
  PAID: "success",
  READY: "success",
  RESOLVED: "success",
  // Em andamento / atenção
  AWAITING_PAYMENT: "warning",
  PROCESSING: "warning",
  PENDING: "warning",
  WAITING_PAYMENT: "warning",
  QUEUED: "warning",
  PRINTING: "warning",
  ASSEMBLY: "warning",
  NFC_WRITING: "warning",
  QUALITY_CHECK: "warning",
  PACKED: "warning",
  SHIPPED: "warning",
  WRITTEN: "warning",
  GENERATED: "warning",
  OPEN: "warning",
  REVIEWING: "warning",
  // Negativo
  EXPIRED: "error",
  BLOCKED: "error",
  REJECTED: "error",
  REFUNDED: "error",
  CHARGEDBACK: "error",
  DISABLED: "error",
  RETURNED: "error",
  CANCELLED: "error",
  FAILED: "error",
  // Neutro
  DRAFT: "secondary",
  CREATED: "secondary",
  ARCHIVED: "muted",
  DISMISSED: "muted",
};

export function statusVariant(status: string): StatusVariant {
  return STATUS_VARIANT[status] ?? "muted";
}

const ROLE_VARIANT: Record<string, StatusVariant> = {
  ADMIN: "default",
  OPERATOR: "warning",
  CUSTOMER: "muted",
};

export function roleVariant(role: string): StatusVariant {
  return ROLE_VARIANT[role] ?? "muted";
}
