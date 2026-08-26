import { prisma } from "@/lib/db";

// Auditoria administrativa (seções 15, 16). Registra ator, ação, entidade e
// antes/depois sanitizado. Toda ação sensível do admin deve chamar esta função.

export interface AuditInput {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: input.before as object | undefined,
      after: input.after as object | undefined,
    },
  });
}
