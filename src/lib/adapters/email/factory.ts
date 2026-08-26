import { getEnv } from "@/lib/env";
import type { EmailProvider } from "./index";
import { ConsoleEmailProvider } from "./index";
import { ResendEmailProvider } from "./resend";

// Factory de e-mail (seção 17). Dev sem Resend -> log; produção -> Resend.
export function getEmailProvider(): EmailProvider {
  const env = getEnv();

  if (env.NODE_ENV === "production") {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      throw new Error("[email] Resend é obrigatório em produção (RESEND_API_KEY/EMAIL_FROM).");
    }
    return new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM);
  }

  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM);
  }

  return new ConsoleEmailProvider();
}
