"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createMagicLink } from "@/lib/auth/magic-link";
import { clearSession } from "@/lib/auth/session";
import { getEmailProvider } from "@/lib/adapters/email/factory";
import { rateLimit } from "@/lib/server/rate-limit";

// Magic link de acesso (seção 12). Mensagem neutra para evitar enumeração de contas.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function requestIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip")?.trim() ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function requestMagicLink(email: string): Promise<{ ok: boolean; devUrl?: string }> {
  const normalized = email.trim().toLowerCase();

  // Sempre retorna a mesma resposta neutra (evita enumerar contas) — inclusive
  // quando o limite é excedido, para não revelar se o e-mail existe.
  if (!EMAIL_RE.test(normalized)) {
    return { ok: true };
  }

  // Limita por e-mail (evita "bombardear" a caixa de alguém) e por IP (evita
  // um único ator criar contas/disparar e-mails em massa).
  const ip = await requestIp();
  const byEmail = rateLimit(`magic-link:email:${normalized}`, 5, 15 * 60_000);
  const byIp = rateLimit(`magic-link:ip:${ip}`, 15, 15 * 60_000);
  if (!byEmail.ok || !byIp.ok) {
    return { ok: true };
  }

  let user = await prisma.user.findUnique({ where: { emailNormalized: normalized } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: normalized, emailNormalized: normalized, role: "CUSTOMER" },
    });
  }

  const token = await createMagicLink(user.id);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${base}/entrar/${token}`;

  await getEmailProvider().send({
    to: normalized,
    template: "magic-link",
    subject: "Seu link de acesso",
    data: { url },
  });

  // Em desenvolvimento, expõe o link para facilitar o fluxo local.
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, devUrl: url };
  }
  return { ok: true };
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}
