import { z } from "zod";

// Catálogo de templates românticos (seções 5, 11). O template altera apenas a
// apresentação; o schema de conteúdo é único e versionado (projects.ts).

export const TEMPLATE_SLUGS = {
  ROMANCE_CLASSICO: "romance-classico",
  NOSSA_LINHA_DO_TEMPO: "nossa-linha-do-tempo",
  AMOR_MINIMALISTA: "amor-minimalista",
} as const;

export const templatePresetsSchema = z.object({
  // Chaves de presets de cor aprovados (nunca cores livres do usuário).
  colorSchemes: z.array(z.string()).min(1),
  defaultScheme: z.string(),
});

export type TemplatePresets = z.infer<typeof templatePresetsSchema>;

export interface TemplateDefinition {
  slug: string;
  name: string;
  description: string;
  /** Identificador do componente de renderização (implementado na Fase 2). */
  component: "romance-classico" | "nossa-linha-do-tempo" | "amor-minimalista";
  presets: TemplatePresets;
}

export const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  {
    slug: TEMPLATE_SLUGS.ROMANCE_CLASSICO,
    name: "Romance Clássico",
    description: "Capa em tela cheia, carta central, galeria em mosaico e linha do tempo.",
    component: "romance-classico",
    presets: {
      colorSchemes: ["vinho", "rosa-queimado", "dourado"],
      defaultScheme: "vinho",
    },
  },
  {
    slug: TEMPLATE_SLUGS.NOSSA_LINHA_DO_TEMPO,
    name: "Nossa Linha do Tempo",
    description: "Editorial, com momentos alternando foto e texto em uma linha vertical.",
    component: "nossa-linha-do-tempo",
    presets: {
      colorSchemes: ["vinho", "rosa-queimado", "grafite"],
      defaultScheme: "vinho",
    },
  },
  {
    slug: TEMPLATE_SLUGS.AMOR_MINIMALISTA,
    name: "Amor Minimalista",
    description: "Tipografia grande, bastante respiro e estética neutra.",
    component: "amor-minimalista",
    presets: {
      colorSchemes: ["grafite", "vinho", "rosa-queimado"],
      defaultScheme: "grafite",
    },
  },
];
