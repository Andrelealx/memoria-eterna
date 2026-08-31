import { z } from "zod";
import { nicheSchema } from "./enums";

// Schema de conteúdo do projeto (seções 10, 11, 15). Versionado: mudanças no
// contrato exigem bump em `CURRENT_CONTENT_VERSION` e migração de dados antigos.

export const CURRENT_CONTENT_VERSION = 1;

const musicSchema = z.object({
  provider: z.enum(["spotify", "youtube"]),
  kind: z.string(),
  id: z.string(),
  embedUrl: z.string().url(),
});

const photoSchema = z.object({
  assetId: z.string(),
  altText: z.string().max(200).default(""),
  position: z.number().int().min(0),
  isCover: z.boolean().default(false),
});

const momentSchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  title: z.string().max(120).default(""),
  text: z.string().max(2000).default(""),
  assetId: z.string().optional(),
});

const pronounsSchema = z.object({
  creator: z.string().max(40).optional(),
  recipient: z.string().max(40).optional(),
});

export const projectContentSchema = z.object({
  schemaVersion: z.number().int().positive().default(CURRENT_CONTENT_VERSION),
  niche: nicheSchema,
  // Rascunhos podem estar incompletos; a obrigatoriedade é validada no checkout.
  creatorName: z.string().max(120).default(""),
  recipientName: z.string().max(120).default(""),
  title: z.string().max(120).default(""),
  relationshipDate: z.string().optional(), // ISO yyyy-mm-dd
  message: z.string().max(5000).default(""),
  pronouns: pronounsSchema.optional(),
  counterEnabled: z.boolean().default(true),
  photos: z.array(photoSchema).default([]),
  moments: z.array(momentSchema).default([]),
  music: musicSchema.nullable().default(null),
  finalPhrase: z.string().max(300).default(""),
  colorScheme: z.string().default("vinho"),
});

export type ProjectContent = z.infer<typeof projectContentSchema>;

/** Conteúdo inicial válido para que um rascunho possa ser retomado imediatamente. */
export function emptyProjectContent(niche: ProjectContent["niche"]): ProjectContent {
  return {
    schemaVersion: CURRENT_CONTENT_VERSION,
    niche,
    creatorName: "",
    recipientName: "",
    title: "",
    relationshipDate: "",
    message: "",
    counterEnabled: niche === "romance",
    photos: [],
    moments: [],
    music: null,
    finalPhrase: "",
    colorScheme: "vinho",
  };
}

/** Valida e devolve o conteúdo normalizado. Lança em conteúdo inválido. */
export function parseProjectContent(content: unknown): ProjectContent {
  return projectContentSchema.parse(content);
}

/** Verifica se o conteúdo respeita os limites do plano (seções 4, 23). */
export function contentWithinLimits(
  content: ProjectContent,
  limits: { maxPhotos: number; maxMoments: number },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (content.photos.length > limits.maxPhotos) {
    errors.push(`Máximo de ${limits.maxPhotos} fotos.`);
  }
  if (content.moments.length > limits.maxMoments) {
    errors.push(`Máximo de ${limits.maxMoments} momentos.`);
  }
  return { ok: errors.length === 0, errors };
}
