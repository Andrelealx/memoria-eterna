"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createMagicLink } from "@/lib/auth/magic-link";
import { clearSession } from "@/lib/auth/session";
import { getEmailProvider } from "@/lib/adapters/email/factory";

// Magic link de acesso (seção 12). Mensagem neutra para evitar enumeração de contas.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function requestMagicLink(email: string): Promise<{ ok: boolean; devUrl?: string }> {
  const normalized = email.trim().toLowerCase();

  // Sempre retorna a mesma resposta neutra (evita enumerar contas).
  if (!EMAIL_RE.test(normalized)) {
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
