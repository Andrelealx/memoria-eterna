import { cache } from "react";
import { prisma } from "@/lib/db";
import { parseProjectContent, type ProjectContent } from "@/lib/domain/projects";
import { resolveProjectPhotos, type PhotoRef, type PublicPhoto } from "./media";

export interface PublishedProject {
  id: string;
  slug: string;
  templateSlug: string;
  content: ProjectContent;
  photos: PublicPhoto[];
}

/**
 * Busca um projeto publicável por slug. Retorna null se não existir, não estiver
 * publicado ou estiver expirado (a validade conta a partir da publicação).
 */
async function loadPublishedProject(slug: string): Promise<PublishedProject | null> {
  const project = await prisma.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { template: true },
  });
  if (!project) return null;

  if (project.expiresAt && project.expiresAt.getTime() < Date.now()) {
    return null;
  }

  const content = parseProjectContent(project.content);
  const photos = await resolveProjectPhotos(project.id, content.photos as PhotoRef[]);

  return {
    id: project.id,
    slug: project.slug ?? "",
    templateSlug: project.template.slug,
    content,
    photos,
  };
}

// Metadata e página pedem o mesmo presente durante a renderização. A cache do
// React evita repetir consulta, parsing e assinatura de todas as fotos.
export const getPublishedProject = cache(loadPublishedProject);
