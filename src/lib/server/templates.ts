import { prisma } from "@/lib/db";
import { templatePresetsSchema, type TemplateDefinition } from "@/lib/domain/templates";
import type { Niche } from "@/lib/domain/enums";

// Leitura do catálogo de templates a partir do banco (status ACTIVE). O campo
// `component` é derivado do slug (o renderizador resolve pelo slug).

interface TemplateRow {
  slug: string;
  name: string;
  description: string | null;
  presets: unknown;
  category: { slug: string };
}

function toDefinition(row: TemplateRow): TemplateDefinition {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    niche: row.category.slug as Niche,
    component: row.slug,
    presets: templatePresetsSchema.parse(row.presets ?? {}),
  };
}

/** Lista os templates ativos, ordenados por nome dentro do nicho. */
export async function listActiveTemplates(): Promise<TemplateDefinition[]> {
  const rows = await prisma.template.findMany({
    where: { status: "ACTIVE" },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return rows.map(toDefinition);
}

/** Retorna um template ativo pelo slug (ou null). */
export async function getActiveTemplate(slug: string): Promise<TemplateDefinition | null> {
  const row = await prisma.template.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!row || row.status !== "ACTIVE") return null;
  return toDefinition(row);
}
