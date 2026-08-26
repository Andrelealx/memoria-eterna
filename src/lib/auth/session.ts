import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { SessionUser } from "./authorize";

// Sessão por cookie assinado (dev). Em produção a autenticação é delegada ao
// Supabase Auth (ver docs/DEPLOYMENT.md). O cookie é HttpOnly/SameSite/Secure.

export const SESSION_COOKIE = "fyp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

const SECRET = process.env.APP_ENCRYPTION_KEY ?? "dev-only-session-secret";

/** Assina o id do usuário em um token de sessão. */
export function signSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ u: userId, t: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

function verify(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u: string };
    return data.u;
  } catch {
    return null;
  }
}

/** Usuário da sessão atual (ou null). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = verify(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return { id: user.id, email: user.email, role: user.role };
}

/** Define a sessão a partir de um Server Action. */
export async function setSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSessionToken(userId), sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
