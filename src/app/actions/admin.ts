"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createNfcTag, transitionNfcTag, transitionPhysicalOrder } from "@/lib/server/nfc";
import { writeAudit } from "@/lib/server/audit";
import { normalizeCouponCode } from "@/lib/domain/coupons";
import type { CouponType, NfcTagStatus, PhysicalOrderStatus, Role } from "@/lib/domain/enums";

// Ações administrativas (seções 13, 16). Todas verificam papel no servidor e
// registram auditoria. Operadores físicos não acessam dados financeiros.

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "OPERATOR"].includes(user.role)) {
    throw new Error("[admin] Acesso negado.");
  }
  return user;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("[admin] Acesso negado: somente administradores.");
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

export async function adminUpdatePlanPrice(planId: string, priceCents: number): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  if (!Number.isInteger(priceCents) || priceCents <= 0) throw new Error("[admin] Preço inválido.");
  await prisma.plan.update({ where: { id: planId }, data: { priceCents } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "plan.price_update",
    entity: "plan",
    entityId: planId,
    after: { priceCents },
  });
  return { ok: true };
}

export interface UpdatePlanInput {
  name?: string;
  durationDays?: number | null;
}

export async function adminUpdatePlan(planId: string, input: UpdatePlanInput): Promise<{ ok: boolean }> {
  const user = await requireStaff();

  const patch: { name?: string; durationDays?: number | null } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("[admin] Nome inválido.");
    patch.name = name;
  }
  if (input.durationDays !== undefined) {
    if (input.durationDays !== null && (!Number.isInteger(input.durationDays) || input.durationDays < 0)) {
      throw new Error("[admin] Duração inválida.");
    }
    patch.durationDays = input.durationDays;
  }

  await prisma.plan.update({ where: { id: planId }, data: patch });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "plan.update",
    entity: "plan",
    entityId: planId,
    after: patch,
  });
  return { ok: true };
}

export async function adminSetTemplateStatus(
  templateId: string,
  status: "ACTIVE" | "ARCHIVED",
): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  await prisma.template.update({ where: { id: templateId }, data: { status } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: status === "ACTIVE" ? "template.activate" : "template.archive",
    entity: "template",
    entityId: templateId,
    after: { status },
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Cupons (CRUD administrativo)
// ---------------------------------------------------------------------------

export interface CreateCouponInput {
  code: string;
  type: CouponType;
  value: string;
  validUntil?: string | null;
}

export async function adminCreateCoupon(input: CreateCouponInput): Promise<{ ok: boolean }> {
  const user = await requireStaff();

  const code = normalizeCouponCode(input.code);
  if (!code) throw new Error("[admin] Informe o código do cupom.");

  let valueCents: number;
  if (input.type === "FIXED") {
    const reais = Number(input.value.replace(",", "."));
    if (!Number.isFinite(reais) || reais <= 0) throw new Error("[admin] Valor inválido.");
    valueCents = Math.round(reais * 100);
  } else {
    const pct = Number(input.value);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
      throw new Error("[admin] Percentual deve ser um número inteiro entre 1 e 100.");
    }
    valueCents = pct;
  }

  const validUntil = input.validUntil ? new Date(input.validUntil) : null;
  if (validUntil && Number.isNaN(validUntil.getTime())) throw new Error("[admin] Data de expiração inválida.");

  // Vincula a todos os planos existentes para o cupom ser aplicável no checkout.
  const plans = await prisma.plan.findMany({ select: { id: true } });
  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: input.type,
      value: valueCents,
      validUntil,
      active: true,
      plans: { create: plans.map((p) => ({ planId: p.id })) },
    },
  });

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "coupon.create",
    entity: "coupon",
    entityId: coupon.id,
    after: { code, type: input.type, value: valueCents, validUntil: validUntil?.toISOString() ?? null },
  });
  return { ok: true };
}

export async function adminToggleCoupon(couponId: string, active: boolean): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  await prisma.coupon.update({ where: { id: couponId }, data: { active } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: active ? "coupon.activate" : "coupon.deactivate",
    entity: "coupon",
    entityId: couponId,
  });
  return { ok: true };
}

export async function adminDeleteCoupon(couponId: string): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  const redemptions = await prisma.couponRedemption.count({ where: { couponId } });
  if (redemptions > 0) {
    throw new Error("[admin] Cupom já utilizado; desative-o em vez de excluir.");
  }
  await prisma.coupon.delete({ where: { id: couponId } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "coupon.delete",
    entity: "coupon",
    entityId: couponId,
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Moderação de denúncias
// ---------------------------------------------------------------------------

export async function adminResolveReport(
  reportId: string,
  status: "RESOLVED" | "DISMISSED",
): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  await prisma.abuseReport.update({
    where: { id: reportId },
    data: { status, resolvedBy: user.id },
  });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: status === "RESOLVED" ? "report.resolve" : "report.dismiss",
    entity: "abuse_report",
    entityId: reportId,
    after: { status },
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Gestão de usuários (papéis)
// ---------------------------------------------------------------------------

const CHANGEABLE_ROLES: Role[] = ["CUSTOMER", "OPERATOR", "ADMIN"];

export async function adminChangeRole(userId: string, role: Role): Promise<{ ok: boolean }> {
  const user = await requireAdmin();
  if (!CHANGEABLE_ROLES.includes(role)) throw new Error("[admin] Papel inválido.");
  if (userId === user.id) throw new Error("[admin] Você não pode alterar o próprio papel.");
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "user.role_change",
    entity: "user",
    entityId: userId,
    after: { role },
  });
  return { ok: true };
}
