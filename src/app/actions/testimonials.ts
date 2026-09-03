"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { writeAudit } from "@/lib/server/audit";
import { uploadTestimonialMedia, removeTestimonialMedia } from "@/lib/server/testimonial-media";
import type { TestimonialMediaType } from "@prisma/client";

// Depoimentos de clientes (prova social na home). Ações administrativas —
// mesmo padrão de templates/cupons: qualquer ADMIN ou OPERATOR pode gerenciar.

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "OPERATOR"].includes(user.role)) {
    throw new Error("[admin] Acesso negado.");
  }
  return user;
}

const MEDIA_TYPES: TestimonialMediaType[] = ["NONE", "PHOTO", "VIDEO"];
const YOUTUBE_RE = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

function revalidateHome(): void {
  revalidatePath("/");
}

export async function adminCreateTestimonial(formData: FormData): Promise<{ ok: boolean }> {
  const user = await requireStaff();

  const authorName = String(formData.get("authorName") ?? "").trim();
  const occasion = String(formData.get("occasion") ?? "").trim() || null;
  const quote = String(formData.get("quote") ?? "").trim() || null;
  const mediaTypeRaw = String(formData.get("mediaType") ?? "NONE");
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();
  const file = formData.get("file");

  if (!authorName) throw new Error("[depoimento] Nome do cliente é obrigatório.");
  if (!MEDIA_TYPES.includes(mediaTypeRaw as TestimonialMediaType)) {
    throw new Error("[depoimento] Tipo de mídia inválido.");
  }
  const mediaType = mediaTypeRaw as TestimonialMediaType;

  let mediaUrl: string | null = null;
  if (mediaType === "VIDEO" && externalUrl) {
    if (!YOUTUBE_RE.test(externalUrl)) {
      throw new Error("[depoimento] Link de vídeo deve ser do YouTube.");
    }
    mediaUrl = externalUrl;
  } else if (mediaType !== "NONE" && file instanceof File && file.size > 0) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const uploaded = await uploadTestimonialMedia(buffer, file.type);
    mediaUrl = uploaded.url;
  } else if (mediaType !== "NONE") {
    throw new Error("[depoimento] Envie um arquivo ou um link do YouTube.");
  }

  const maxOrder = await prisma.testimonial.aggregate({ _max: { order: true } });

  const created = await prisma.testimonial.create({
    data: {
      authorName,
      occasion,
      quote,
      mediaType,
      mediaUrl,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "testimonial.create",
    entity: "testimonial",
    entityId: created.id,
  });
  revalidateHome();
  return { ok: true };
}

export async function adminUpdateTestimonial(
  id: string,
  input: { authorName?: string; occasion?: string | null; quote?: string | null; order?: number },
): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  const patch: { authorName?: string; occasion?: string | null; quote?: string | null; order?: number } = {};
  if (input.authorName !== undefined) {
    const v = input.authorName.trim();
    if (!v) throw new Error("[depoimento] Nome do cliente é obrigatório.");
    patch.authorName = v;
  }
  if (input.occasion !== undefined) patch.occasion = input.occasion?.trim() || null;
  if (input.quote !== undefined) patch.quote = input.quote?.trim() || null;
  if (input.order !== undefined) {
    if (!Number.isInteger(input.order)) throw new Error("[depoimento] Ordem inválida.");
    patch.order = input.order;
  }

  await prisma.testimonial.update({ where: { id }, data: patch });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "testimonial.update",
    entity: "testimonial",
    entityId: id,
    after: patch,
  });
  revalidateHome();
  return { ok: true };
}

export async function adminToggleTestimonial(id: string, active: boolean): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  await prisma.testimonial.update({ where: { id }, data: { active } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: active ? "testimonial.activate" : "testimonial.deactivate",
    entity: "testimonial",
    entityId: id,
  });
  revalidateHome();
  return { ok: true };
}

export async function adminDeleteTestimonial(id: string): Promise<{ ok: boolean }> {
  const user = await requireStaff();
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return { ok: true };

  await prisma.testimonial.delete({ where: { id } });
  if (existing.mediaUrl) await removeTestimonialMedia(existing.mediaUrl);

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "testimonial.delete",
    entity: "testimonial",
    entityId: id,
    before: { authorName: existing.authorName },
  });
  revalidateHome();
  return { ok: true };
}
