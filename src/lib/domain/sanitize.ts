// Sanitização de texto (seções 18, 23). Bloqueia HTML arbitrário e controla
// comprimento, tratando toda entrada do usuário como texto puro.

/** Remove tags HTML e entidades comuns, deixando apenas texto puro. */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/** Remove caracteres de controle (exceto quebras de linha) e normaliza espaços. */
function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/**
 * Sanitiza um texto livre: remove HTML, caracteres de controle e limita o tamanho.
 * Retorna string vazia se a entrada for inválida.
 */
export function sanitizeText(input: string, maxLength = 5000): string {
  if (typeof input !== "string") return "";
  const cleaned = stripControlChars(stripHtml(input)).trim();
  return cleaned.slice(0, maxLength);
}

/** Valida que a entrada é "texto simples" (não contém marcação). */
export function isPlainText(input: string): boolean {
  return !/<[a-zA-Z/!][^>]*>/.test(input) && !/[<>]/.test(input);
}
