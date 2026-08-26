// Geração e validação de slugs amigáveis (seções 10.5, 11, 23).

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Normaliza um texto em slug seguro. Ex.: "Nossa História" -> "nossa-historia". */
export function slugify(input: string, maxLength = 48): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/** Valida se um slug já está no formato permitido. */
export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

/** Palavras reservadas que não podem ser usadas como slug (rotas da aplicação). */
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "modelos",
  "como-funciona",
  "precos",
  "criar",
  "checkout",
  "pagamento",
  "presente",
  "t",
  "denunciar",
  "termos",
  "privacidade",
  "ajuda",
  "entrar",
  "painel",
  "conta",
]);

/** Um slug é utilizável se é válido e não é reservado. */
export function isSlugAvailable(slug: string, existing: Set<string>): boolean {
  if (!isValidSlug(slug)) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return !existing.has(slug);
}

/** Sugere um slug único a partir de um texto base, evitando colisões. */
export function suggestUniqueSlug(base: string, existing: Set<string>): string {
  const root = slugify(base) || "presente";
  if (isSlugAvailable(root, existing)) return root;
  let n = 2;
  while (n < 100) {
    const candidate = `${root}-${n}`;
    if (isSlugAvailable(candidate, existing)) return candidate;
    n += 1;
  }
  return `${root}-${Math.random().toString(36).slice(2, 8)}`;
}
