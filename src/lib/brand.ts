// Configuração central da marca (seção 3.79 do PROMPT MESTRE).
// Nome, domínio, cores e dados jurídicos ficam centralizados para permitir
// troca futura sem refatoração. "Presente Vivo" é apenas nome de trabalho.

export const brand = {
  /** Nome de trabalho. Substituir após pesquisa de domínio/marca. */
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Presente Vivo",
  domain: process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? "localhost:3000",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Dados jurídicos — NÃO preencher valores fictícios (CNPJ/telefone).
  legal: {
    companyName: undefined as string | undefined,
    cnpj: undefined as string | undefined,
    email: process.env.EMAIL_FROM ?? undefined,
  },

  tagline: "Suas memórias em um presente que pode ser tocado.",
} as const;

// Paleta (seção 7) — referência central para uso em SVG/QR e afins.
export const palette = {
  creme: "#FFF9F5",
  white: "#FFFFFF",
  vinho: "#7A2438",
  vinhoEscuro: "#4B1625",
  rosaQueimado: "#D99AAA",
  rosaClaro: "#F8E8EC",
  dourado: "#C6A15B",
  grafite: "#231F20",
  cinzaTexto: "#6E6568",
  bordaSuave: "#EADDE0",
  sucesso: "#247A52",
  erro: "#B42318",
} as const;

export type Palette = typeof palette;
