"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createNfcTag, transitionNfcTag, transitionPhysicalOrder } from "@/lib/server/nfc";
import { writeAudit } from "@/lib/server/audit";
import type { NfcTagStatus, PhysicalOrderStatus } from "@/lib/domain/enums";

// Ações administrativas (seções 13, 16). Todas verificam papel no servidor e
// registram auditoria. Operadores físicos não acessam dados financeiros.

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "OPERATOR"].includes(user.role)) {
    throw new Error("[admin] Acesso negado.");
  }
  return user;
}

export async function adminGenerateTag(
  projectId: string | null,
  physicalOrderId: string | null,
): Promise<{ id: string; token: string; url: string }> {
  const user = await requireStaff();
  const tag = await createNfcTag(projectId, physicalOrderId);
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "nfc.tag.generated",
    entity: "nfc_tag",
    entityId: tag.id,
  });
  return tag;
}

export async function adminTransitionTag(tagId: string, to: NfcTagStatus): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  await transitionNfcTag(tagId, to);
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "nfc.tag.transition",
    entity: "nfc_tag",
    entityId: tagId,
    after: { to },
  });
  return { ok: true };
}

export async function adminSetTagDestination(tagId: string, destinationUrl: string): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  await prisma.nfcTag.update({ where: { id: tagId }, data: { destinationUrl } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "nfc.tag.destination",
    entity: "nfc_tag",
    entityId: tagId,
    after: { destinationUrl },
  });
  return { ok: true };
}

export async function adminTransitionPhysical(
  physicalOrderId: string,
  to: PhysicalOrderStatus,
): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  await transitionPhysicalOrder(physicalOrderId, to);
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "physical.transition",
    entity: "physical_order",
    entityId: physicalOrderId,
    after: { to },
  });
  return { ok: true };
}

export async function adminTogglePlan(planId: string, active: boolean): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  await prisma.plan.update({ where: { id: planId }, data: { active } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: active ? "plan.activate" : "plan.deactivate",
    entity: "plan",
    entityId: planId,
  });
  return { ok: true };
}
