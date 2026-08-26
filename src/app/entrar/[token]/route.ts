import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth/magic-link";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/auth/session";

// Consome o magic link e define o cookie de sessão (Route Handler, pois cookies
// só podem ser modificados em Server Action ou Route Handler).

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await ctx.params;
  const userId = await consumeMagicLink(token);

  if (!userId) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  const res = NextResponse.redirect(new URL("/painel", req.url));
  res.cookies.set(SESSION_COOKIE, signSessionToken(userId), sessionCookieOptions());
  return res;
}
