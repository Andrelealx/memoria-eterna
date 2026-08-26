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

export function formatDate(iso: Date | string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
