// Configuração central da marca. Nome, domínio, cores e dados jurídicos ficam
// centralizados para permitir troca futura sem refatoração.

export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Memória Eterna",
  domain: process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? "memoriaeternaprime.com.br",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Dados jurídicos — NÃO preencher valores fictícios (CNPJ/telefone).
  legal: {
    companyName: undefined as string | undefined,
    cnpj: undefined as string | undefined,
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? undefined,
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
