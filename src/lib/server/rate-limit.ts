// Rate limiting simples em memória (janela fixa).
// NOTA: em serverless (Vercel) este estado não é compartilhado entre instâncias.
// Para produção, substituir por Upstash Redis ou similar (ver docs/DEPLOYMENT.md).

const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Expurgo lazy de buckets expirados, para o Map não crescer sem limites.
  // Chaves que nunca são re-solicitadas são removidas aqui em vez de ficarem
  // retidas para sempre (vazamento de memória em execuções longas).
  for (const [existingKey, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(existingKey);
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}
