import { prisma } from "@/lib/db";
import { generateMagicLinkToken, hashToken } from "@/lib/domain/tokens";

// Autenticação sem senha por magic link (seção 12), via PostgreSQL + Resend.
// Token de uso único, hash no banco (nunca o valor bruto) e expiração curta.

const MAGIC_LINK_TTL_MS = 30 * 60 * 1000; // 30 minutos

/** Cria um magic link e devolve o token bruto (a ser enviado por e-mail). */
export async function createMagicLink(userId: string): Promise<string> {
  const raw = generateMagicLinkToken();
  await prisma.magicLinkToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
    },
  });
  return raw;
}

/**
 * Consome um magic link: valida hash, expiração e uso único.
 * Retorna o userId se válido; null caso contrário (mensagem neutra ao cliente).
 */
export async function consumeMagicLink(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.magicLinkToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}
