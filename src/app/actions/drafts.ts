"use server";

import { prisma } from "@/lib/db";
import { generateDraftToken } from "@/lib/domain/tokens";
import {
  emptyProjectContent,
  parseProjectContent,
  type ProjectContent,
} from "@/lib/domain/projects";
import { resolveProjectPhotos, type PhotoRef, type PublicPhoto } from "@/lib/server/media";
import { templatePresetsSchema } from "@/lib/domain/templates";

// Server actions do assistente de criação (seção 10). Todo o estado persistido
// vive no servidor; o rascunho é retomável via `draft_token`.

export async function createDraft(templateSlug: string): Promise<{ draftToken: string }> {
  const template = await prisma.template.findUnique({
    where: { slug: templateSlug },
    include: { category: true },
  });
  if (!template) throw new Error("[draft] Template inválido.");

  const draftToken = generateDraftToken();
  const initialContent = emptyProjectContent(template.category.slug as ProjectContent["niche"]);
  initialContent.colorScheme = templatePresetsSchema.parse(template.presets).defaultScheme;
  await prisma.project.create({
    data: {
      draftToken,
      templateId: template.id,
      templateVersion: template.version,
      status: "DRAFT",
      content: initialContent,
    },
  });

  return { draftToken };
}

/** Troca o modelo de um rascunho existente sem criar projetos órfãos. */
export async function updateDraftTemplate(
  draftToken: string,
  templateSlug: string,
): Promise<{ ok: boolean }> {
  const [project, template] = await Promise.all([
    prisma.project.findUnique({ where: { draftToken } }),
    prisma.template.findUnique({ where: { slug: templateSlug }, include: { category: true } }),
  ]);
  if (!project || project.status !== "DRAFT") throw new Error("Rascunho não encontrado.");
  if (!template || template.status !== "ACTIVE") throw new Error("Modelo indisponível.");

  const current = parseProjectContent(project.content);
  const presets = templatePresetsSchema.parse(template.presets);
  await prisma.project.update({
    where: { id: project.id },
    data: {
      templateId: template.id,
      templateVersion: template.version,
      content: { ...current, niche: template.category.slug, colorScheme: presets.defaultScheme },
    },
  });
  return { ok: true };
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

/** Aplica um rascunho gerado e o modelo escolhido em uma única transação. */
export async function applyGeneratedDraft(input: {
  draftToken?: string | null;
  templateSlug: string;
  content: unknown;
}): Promise<{ draftToken: string }> {
  const parsedContent = parseProjectContent(input.content);

  return prisma.$transaction(async (tx) => {
    const template = await tx.template.findUnique({
      where: { slug: input.templateSlug },
      include: { category: true },
    });
    if (!template || template.status !== "ACTIVE") throw new Error("Modelo indisponível.");

    const presets = templatePresetsSchema.parse(template.presets);
    const content: ProjectContent = {
      ...parsedContent,
      niche: template.category.slug as ProjectContent["niche"],
      colorScheme: presets.colorSchemes.includes(parsedContent.colorScheme)
        ? parsedContent.colorScheme
        : presets.defaultScheme,
    };

    if (input.draftToken) {
      const project = await tx.project.findUnique({ where: { draftToken: input.draftToken } });
      if (!project || project.status !== "DRAFT") throw new Error("Rascunho não encontrado.");
      await tx.project.update({
        where: { id: project.id },
        data: {
          templateId: template.id,
          templateVersion: template.version,
          content,
        },
      });
      return { draftToken: input.draftToken };
    }

    const draftToken = generateDraftToken();
    await tx.project.create({
      data: {
        draftToken,
        templateId: template.id,
        templateVersion: template.version,
        status: "DRAFT",
        content,
      },
    });
    return { draftToken };
  });
}

export interface LoadedDraft {
  templateSlug: string;
  content: ProjectContent;
  photos: PublicPhoto[];
  updatedAt: string;
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

  return {
    templateSlug: project.template.slug,
    content,
    photos,
    updatedAt: project.updatedAt.toISOString(),
  };
}
