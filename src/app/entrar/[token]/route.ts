import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth/magic-link";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db";

// Consome o magic link e define o cookie de sessão (Route Handler, pois cookies
// só podem ser modificados em Server Action ou Route Handler). Staff cai direto
// no admin; clientes, no painel (ou em `next`, quando o link aponta para um
// destino específico — ex.: o presente que acabou de ser pago).

/** Só aceita caminhos internos (`/algo`), nunca URLs absolutas ou `//host` (open redirect). */
function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await ctx.params;
  const userId = await consumeMagicLink(token);

  if (!userId) {
    return NextResponse.redirect(new URL("/entrar?erro=link-invalido", req.url));
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const next = safeNextPath(new URL(req.url).searchParams.get("next"));
  const destination = isStaff(user) ? "/admin" : (next ?? "/painel");

  const res = NextResponse.redirect(new URL(destination, req.url));
  res.cookies.set(SESSION_COOKIE, signSessionToken(userId), sessionCookieOptions());
  return res;
}
