import { z } from "zod";

// Validação de variáveis de ambiente (seção 24).
// A aplicação NÃO deve expor valores/segredos ao cliente. Esta validação roda
// somente no servidor. Falhas de variáveis obrigatórias em produção geram erro
// técnico claro no log (nunca no cliente).

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_BRAND_NAME: z.string().default("Memória Eterna"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),
  CRON_SECRET: z.string().optional(),
  APP_ENCRYPTION_KEY: z.string().optional(),
  DEV_FAKE_PAYMENT_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  DEV_FAKE_AI_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Lê e valida o ambiente uma única vez (com cache). */
export function getEnv(): Env {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}

/** Variáveis críticas para produção. Lança se ausentes (chamado no boot do servidor). */
export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) missing.push("MERCADO_PAGO_ACCESS_TOKEN");
  if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET) missing.push("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!process.env.APP_ENCRYPTION_KEY) missing.push("APP_ENCRYPTION_KEY");
  if (missing.length > 0) {
    throw new Error(
      `[env] Configurações obrigatórias ausentes em produção: ${missing.join(", ")}. ` +
        "A aplicação não iniciará sem elas (não exponha estes valores no cliente).",
    );
  }
}

/** Modo de pagamento fake disponível APENAS em desenvolvimento. */
export function isFakePaymentEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && getEnv().DEV_FAKE_PAYMENT_ENABLED;
}
