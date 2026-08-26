"use server";

import { prisma } from "@/lib/db";
import { generateDraftToken } from "@/lib/domain/tokens";
import { parseProjectContent, type ProjectContent } from "@/lib/domain/projects";
import { resolveProjectPhotos, type PhotoRef, type PublicPhoto } from "@/lib/server/media";

// Server actions do assistente de criação (seção 10). Todo o estado persistido
// vive no servidor; o rascunho é retomável via `draft_token`.

export async function createDraft(templateSlug: string): Promise<{ draftToken: string }> {
  const template = await prisma.template.findUnique({ where: { slug: templateSlug } });
  if (!template) throw new Error("[draft] Template inválido.");

  const draftToken = generateDraftToken();
  await prisma.project.create({
    data: {
      draftToken,
      templateId: template.id,
      templateVersion: template.version,
      status: "DRAFT",
      content: { schemaVersion: 1, niche: "romance" },
    },
  });

  return { draftToken };
}

export async function saveDraft(input: {
  draftToken: string;
  content: unknown;
}): Promise<{ ok: boolean }> {
  const project = await prisma.project.findUnique({ where: { draftToken: input.draftToken } });
  if (!project) throw new Error("[draft] Rascunho não encontrado.");

  const content = parseProjectContent(input.content);
  await prisma.project.update({ where: { id: project.id }, data: { content } });

  return { ok: true };
}

export interface LoadedDraft {
  templateSlug: string;
  content: ProjectContent;
  photos: PublicPhoto[];
}

/** Retoma um rascunho existente pelo token (mesmo dispositivo). */
export async function loadDraft(draftToken: string): Promise<LoadedDraft | null> {
  const project = await prisma.project.findUnique({
    where: { draftToken },
    include: { template: true },
  });
  if (!project || project.status !== "DRAFT") return null;

  const content = parseProjectContent(project.content);
  const photos = await resolveProjectPhotos(project.id, content.photos as PhotoRef[]);

  return { templateSlug: project.template.slug, content, photos };
}
