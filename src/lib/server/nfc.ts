import { prisma } from "@/lib/db";
import { generateNfcToken } from "@/lib/domain/tokens";
import { nfcUrl } from "./qr";
import { assertTransition, canPackPhysicalOrder } from "@/lib/domain/state-machine";
import type { NfcTagStatus, PhysicalOrderStatus } from "@/lib/domain/enums";

// Operação de tags NFC e pedido físico (seções 13, 16). Transições são validadas
// pela state machine; nunca um select livre no frontend.

export async function createNfcTag(
  projectId: string | null,
  physicalOrderId: string | null,
): Promise<{ id: string; token: string; url: string }> {
  const token = generateNfcToken();
  const tag = await prisma.nfcTag.create({
    data: { publicToken: token, projectId, physicalOrderId, status: "GENERATED" },
  });
  return { id: tag.id, token, url: nfcUrl(token) };
}

export async function transitionNfcTag(tagId: string, to: NfcTagStatus): Promise<void> {
  const tag = await prisma.nfcTag.findUnique({ where: { id: tagId } });
  if (!tag) throw new Error("[nfc] Tag não encontrada.");

  assertTransition("nfcTag", tag.status, to);

  const now = new Date();
  await prisma.nfcTag.update({
    where: { id: tagId },
    data: {
      status: to,
      writtenAt: to === "WRITTEN" ? now : tag.writtenAt,
      testedAt: to === "TESTED" ? now : tag.testedAt,
      activatedAt: to === "ACTIVE" ? now : tag.activatedAt,
      disabledAt: to === "DISABLED" ? now : tag.disabledAt,
    },
  });
}

export async function transitionPhysicalOrder(
  physicalOrderId: string,
  to: PhysicalOrderStatus,
): Promise<void> {
  const po = await prisma.physicalOrder.findUnique({
    where: { id: physicalOrderId },
    include: { nfcTags: true },
  });
  if (!po) throw new Error("[nfc] Pedido físico não encontrado.");

  assertTransition("physicalOrder", po.status, to);

  // Regra: só empacotar se a tag NFC estiver testada (quando houver NFC).
  if (to === "PACKED" && po.nfcTags.length > 0) {
    const tested = po.nfcTags.every((t) =>
      ["TESTED", "PACKED", "SHIPPED", "ACTIVE"].includes(t.status),
    );
    if (!tested) {
      throw new Error("[nfc] Não é possível embalar antes de testar a tag NFC.");
    }
  }
  if (to === "PACKED" && !canPackPhysicalOrder(po.nfcTags[0]?.status ?? null)) {
    throw new Error("[nfc] Tag NFC não testada.");
  }

  await prisma.physicalOrder.update({ where: { id: physicalOrderId }, data: { status: to } });
}
