import { z } from "zod";

// Catálogo de planos e regras de limite (seção 4). Preços e limites NUNCA são
// hardcoded na interface — vêm do banco/seed. Este arquivo define o schema
// validado e o catálogo inicial usado pelo seed de desenvolvimento.

export const PLAN_SLUGS = {
  MOMENTO: "momento",
  PARA_SEMPRE: "para-sempre",
  KIT_CORACAO_NFC: "kit-coracao-nfc",
} as const;

/** Teto operacional de segurança, mesmo que um plano seja configurado incorretamente. */
export const ABSOLUTE_MAX_PROJECT_PHOTOS = 60;

export const planLimitsSchema = z.object({
  maxPhotos: z.number().int().min(0),
  maxMoments: z.number().int().min(0),
  customSlug: z.boolean().default(false),
  musicEmbed: z.boolean().default(false),
  editAfterPublish: z.boolean().default(false),
  qrDownload: z.boolean().default(false),
  physical: z.boolean().default(false),
});

export type PlanLimits = z.infer<typeof planLimitsSchema>;

export interface PlanDefinition {
  slug: string;
  name: string;
  priceCents: number;
  durationDays: number | null; // null = sem expiração ("Para Sempre")
  includesPhysical: boolean;
  order: number;
  limits: PlanLimits;
}

export const DEFAULT_PLANS: PlanDefinition[] = [
  {
    slug: PLAN_SLUGS.MOMENTO,
    name: "Momento",
    priceCents: 490,
    durationDays: 7,
    includesPhysical: false,
    order: 1,
    limits: {
      maxPhotos: 5,
      maxMoments: 5,
      customSlug: false,
      musicEmbed: false,
      editAfterPublish: false,
      qrDownload: false,
      physical: false,
    },
  },
  {
    slug: PLAN_SLUGS.PARA_SEMPRE,
    name: "Para Sempre",
    priceCents: 1990,
    durationDays: null,
    includesPhysical: false,
    order: 2,
    limits: {
      maxPhotos: 30,
      maxMoments: 12,
      customSlug: true,
      musicEmbed: true,
      editAfterPublish: true,
      qrDownload: true,
      physical: false,
    },
  },
  {
    slug: PLAN_SLUGS.KIT_CORACAO_NFC,
    name: "Kit Coração NFC",
    priceCents: 4990,
    durationDays: null,
    includesPhysical: true,
    order: 3,
    limits: {
      maxPhotos: 30,
      maxMoments: 12,
      customSlug: true,
      musicEmbed: true,
      editAfterPublish: true,
      qrDownload: true,
      physical: true,
    },
  },
];

/** Retorna os limites efetivos de um plano, com fallback seguro. */
export function planLimitsFor(limits: unknown): PlanLimits {
  return planLimitsSchema.parse(limits ?? {});
}

/**
 * Um projeto pode ser editado enquanto é rascunho (pré-compra) ou, depois de
 * publicado, apenas se o plano contratado permitir (Para Sempre, Kit Coração
 * NFC — não o Momento). Ver seção "Posso editar depois?" do FAQ.
 */
export function isProjectStatusEditable(status: string, planLimits: unknown): boolean {
  if (status === "DRAFT") return true;
  if (status === "PUBLISHED") return planLimitsFor(planLimits).editAfterPublish;
  return false;
}
