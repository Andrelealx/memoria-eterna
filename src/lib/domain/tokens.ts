import { createHash, randomBytes, randomInt } from "node:crypto";

// Geração de tokens aleatórios, não sequenciais e difíceis de adivinhar
// (seções 11, 13, 18). Usa CSPRNG do Node. Não colocar dados pessoais na URL.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1 (ambiguidade)

function randomString(length: number, alphabet: string): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** Token público curto e estável da tag NFC (aparece em /t/[token]). */
export function generateNfcToken(length = 7): string {
  return randomString(length, ALPHABET);
}

/** Token secreto de rascunho de visitante (não deve ir em URL pública). */
export function generateDraftToken(length = 32): string {
  return randomBytes(length).toString("base64url");
}

/** Token público adicional para proteger páginas com slug amigável. */
export function generatePublicToken(length = 16): string {
  return randomBytes(length).toString("base64url");
}

/** Token de magic link (dev/auth). */
export function generateMagicLinkToken(length = 32): string {
  return randomBytes(length).toString("base64url");
}

/** Idempotency key para tentativas de pagamento (seção 14). */
export function generateIdempotencyKey(prefix = "pay"): string {
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

/** Hash de um token para armazenamento (nunca armazenar token em texto plano). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Gera um order_number humano (não secreto), ex.: "PV-2026-000123". */
export function generateOrderNumber(seq: number, now = new Date()): string {
  const year = now.getUTCFullYear();
  return `PV-${year}-${String(seq).padStart(6, "0")}`;
}

/** Gera um seq inteiro aleatório (não usado como segredo). */
export function randomIntBetween(min: number, max: number): number {
  return randomInt(min, max + 1);
}
