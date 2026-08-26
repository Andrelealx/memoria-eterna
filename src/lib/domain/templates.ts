import { z } from "zod";
import { NICHES, type Niche } from "./enums";

// Catálogo de templates (seções 5, 11). O template altera apenas a
// apresentação; o schema de conteúdo é único e versionado (projects.ts).
// Cada template pertence a um nicho (`niche`).

export const TEMPLATE_SLUGS = {
  ROMANCE_CLASSICO: "romance-classico",
  NOSSA_LINHA_DO_TEMPO: "nossa-linha-do-tempo",
  AMOR_MINIMALISTA: "amor-minimalista",
  AMIGOS_PARA_SEMPRE: "amigos-para-sempre",
  NOSSA_FAMILIA: "nossa-familia",
  MELHOR_AMIGO: "melhor-amigo",
  FELIZ_ANIVERSARIO: "feliz-aniversario",
  BEM_VINDO_BEBE: "bem-vindo-bebe",
  NOSSO_SIM: "nosso-sim",
  MURAL_DE_MEMORIAS: "mural-de-memorias",
  CANTINHO_DA_FAMILIA: "cantinho-da-familia",
  AVENTURAS_DO_PET: "aventuras-do-pet",
  NOSSA_TRAJETORIA: "nossa-trajetoria",
  ALBUM_DO_BEBE: "album-do-bebe",
  GALERIA_DE_CASAMENTO: "galeria-de-casamento",
  MOMENTOS_DA_AMIZADE: "momentos-da-amizade",
  ALBUM_DA_FAMILIA: "album-da-familia",
  DIARIO_DO_PET: "diario-do-pet",
  SURPRESA_DE_ANIVERSARIO: "surpresa-de-aniversario",
  MES_A_MES: "mes-a-mes",
  NOSSOS_VOTOS: "nossos-votos",
} as const;

export const NICHE_LABELS: Record<Niche, string> = {
  romance: "Romance",
  amizade: "Amizade",
  familia: "Família",
  pet: "Pet",
  aniversario: "Aniversário",
  bebe: "Bebê",
  casamento: "Casamento",
};

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
  niche: Niche;
  /** Identificador do componente de renderização (implementado em components/templates). */
  component: string;
  presets: TemplatePresets;
}

export const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  // --- Romance ---
  {
    slug: TEMPLATE_SLUGS.ROMANCE_CLASSICO,
    name: "Romance Clássico",
    description: "Capa em tela cheia, carta central, galeria em mosaico e linha do tempo.",
    niche: "romance",
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
    niche: "romance",
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
    niche: "romance",
    component: "amor-minimalista",
    presets: {
      colorSchemes: ["grafite", "vinho", "rosa-queimado"],
      defaultScheme: "grafite",
    },
  },

  // --- Amizade ---
  {
    slug: TEMPLATE_SLUGS.AMIGOS_PARA_SEMPRE,
    name: "Amigos para Sempre",
    description: "Celebre a amizade com fotos, histórias e momentos inesquecíveis.",
    niche: "amizade",
    component: "amigos-para-sempre",
    presets: {
      colorSchemes: ["âmbar", "coral", "areia"],
      defaultScheme: "âmbar",
    },
  },
  {
    slug: TEMPLATE_SLUGS.MURAL_DE_MEMORIAS,
    name: "Mural de Memórias",
    description: "Colagem de fotos e momentos em um mural descontraído.",
    niche: "amizade",
    component: "mural-de-memorias",
    presets: {
      colorSchemes: ["coral", "âmbar", "rosa"],
      defaultScheme: "coral",
    },
  },

  // --- Família ---
  {
    slug: TEMPLATE_SLUGS.NOSSA_FAMILIA,
    name: "Nossa Família",
    description: "Reúna as pessoas que importam em uma página cheia de memórias.",
    niche: "familia",
    component: "nossa-familia",
    presets: {
      colorSchemes: ["oliva", "terracota", "areia"],
      defaultScheme: "oliva",
    },
  },
  {
    slug: TEMPLATE_SLUGS.CANTINHO_DA_FAMILIA,
    name: "Cantinho da Família",
    description: "Visual acolhedor e centralizado para reunir a família.",
    niche: "familia",
    component: "cantinho-da-familia",
    presets: {
      colorSchemes: ["terracota", "oliva", "areia"],
      defaultScheme: "terracota",
    },
  },

  // --- Pet ---
  {
    slug: TEMPLATE_SLUGS.MELHOR_AMIGO,
    name: "Meu Melhor Amigo",
    description: "Homenagem ao seu companheiro de quatro patas.",
    niche: "pet",
    component: "melhor-amigo",
    presets: {
      colorSchemes: ["céu", "menta", "areia"],
      defaultScheme: "céu",
    },
  },
  {
    slug: TEMPLATE_SLUGS.AVENTURAS_DO_PET,
    name: "Aventuras do Pet",
    description: "Linha do tempo das aventuras do seu pet.",
    niche: "pet",
    component: "aventuras-do-pet",
    presets: {
      colorSchemes: ["menta", "céu", "areia"],
      defaultScheme: "menta",
    },
  },

  // --- Aniversário ---
  {
    slug: TEMPLATE_SLUGS.FELIZ_ANIVERSARIO,
    name: "Feliz Aniversário",
    description: "Uma surpresa cheia de fotos e mensagens para a data especial.",
    niche: "aniversario",
    component: "feliz-aniversario",
    presets: {
      colorSchemes: ["violeta", "coral", "âmbar"],
      defaultScheme: "violeta",
    },
  },
  {
    slug: TEMPLATE_SLUGS.NOSSA_TRAJETORIA,
    name: "Nossa Trajetória",
    description: "Uma linha do tempo com foto para celebrar a trajetória.",
    niche: "aniversario",
    component: "nossa-trajetoria",
    presets: {
      colorSchemes: ["coral", "violeta", "âmbar"],
      defaultScheme: "coral",
    },
  },

  // --- Bebê ---
  {
    slug: TEMPLATE_SLUGS.BEM_VINDO_BEBE,
    name: "Bem-vindo(a)",
    description: "Anuncie a chegada com os primeiros momentos.",
    niche: "bebe",
    component: "bem-vindo-bebe",
    presets: {
      colorSchemes: ["rosa", "céu", "creme"],
      defaultScheme: "rosa",
    },
  },
  {
    slug: TEMPLATE_SLUGS.ALBUM_DO_BEBE,
    name: "Álbum do Bebê",
    description: "Marcos em cards para registrar os primeiros momentos.",
    niche: "bebe",
    component: "album-do-bebe",
    presets: {
      colorSchemes: ["céu", "rosa", "creme"],
      defaultScheme: "céu",
    },
  },

  // --- Casamento ---
  {
    slug: TEMPLATE_SLUGS.NOSSO_SIM,
    name: "Nosso Sim",
    description: "Elegante, para celebrar o casamento ou as bodas.",
    niche: "casamento",
    component: "nosso-sim",
    presets: {
      colorSchemes: ["marfim", "dourado", "grafite"],
      defaultScheme: "marfim",
    },
  },
  {
    slug: TEMPLATE_SLUGS.GALERIA_DE_CASAMENTO,
    name: "Galeria de Casamento",
    description: "Fotos grandes e elegantes para o grande dia.",
    niche: "casamento",
    component: "galeria-de-casamento",
    presets: {
      colorSchemes: ["rosa", "marfim", "dourado"],
      defaultScheme: "rosa",
    },
  },
  {
    slug: TEMPLATE_SLUGS.MOMENTOS_DA_AMIZADE,
    name: "Momentos da Amizade",
    description: "Fotos em grade e momentos para celebrar a amizade.",
    niche: "amizade",
    component: "momentos-da-amizade",
    presets: {
      colorSchemes: ["coral", "âmbar", "céu"],
      defaultScheme: "coral",
    },
  },
  {
    slug: TEMPLATE_SLUGS.ALBUM_DA_FAMILIA,
    name: "Álbum da Família",
    description: "Capa, carta e galeria de recordações da família.",
    niche: "familia",
    component: "album-da-familia",
    presets: {
      colorSchemes: ["areia", "oliva", "terracota"],
      defaultScheme: "areia",
    },
  },
  {
    slug: TEMPLATE_SLUGS.DIARIO_DO_PET,
    name: "Diário do Pet",
    description: "Marcos do seu pet em formato de diário.",
    niche: "pet",
    component: "diario-do-pet",
    presets: {
      colorSchemes: ["âmbar", "menta", "céu"],
      defaultScheme: "âmbar",
    },
  },
  {
    slug: TEMPLATE_SLUGS.SURPRESA_DE_ANIVERSARIO,
    name: "Surpresa de Aniversário",
    description: "Celebração com fotos grandes para a data especial.",
    niche: "aniversario",
    component: "surpresa-de-aniversario",
    presets: {
      colorSchemes: ["coral", "violeta", "rosa"],
      defaultScheme: "coral",
    },
  },
  {
    slug: TEMPLATE_SLUGS.MES_A_MES,
    name: "Mês a Mês",
    description: "Marcos do bebê em uma linha do tempo mês a mês.",
    niche: "bebe",
    component: "mes-a-mes",
    presets: {
      colorSchemes: ["céu", "rosa", "violeta"],
      defaultScheme: "céu",
    },
  },
  {
    slug: TEMPLATE_SLUGS.NOSSOS_VOTOS,
    name: "Nossos Votos",
    description: "Mensagem em estilo de carta para renovar os votos.",
    niche: "casamento",
    component: "nossos-votos",
    presets: {
      colorSchemes: ["marfim", "dourado", "rosa"],
      defaultScheme: "marfim",
    },
  },
];

/** Agrupa os templates por nicho, na ordem de `NICHES`. */
export function templatesByNiche(): Record<Niche, TemplateDefinition[]> {
  const map = {} as Record<Niche, TemplateDefinition[]>;
  for (const n of NICHES) map[n] = [];
  for (const t of DEFAULT_TEMPLATES) {
    map[t.niche].push(t);
  }
  return map;
}
