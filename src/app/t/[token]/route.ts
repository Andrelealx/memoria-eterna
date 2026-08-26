import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/brand";
import { rateLimit } from "@/lib/server/rate-limit";

// Redirect estável da tag NFC (seção 13). A tag guarda /t/[token] e este endpoint
// redireciona (307) para o destino atual. Tag desativada não redireciona.
// Rate limiting por IP (impede varredura de tokens); em produção, usar store
// distribuída (Upstash) em vez do limiter em memória.

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await ctx.params;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = rateLimit(`nfc:${ip}`, 60, 60_000);
  if (!limit.ok) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const tag = await prisma.nfcTag.findUnique({ where: { publicToken: token } });

  if (!tag || tag.status === "DISABLED" || !tag.destinationUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const target = tag.destinationUrl.startsWith("/")
    ? new URL(tag.destinationUrl, brand.url).toString()
    : tag.destinationUrl;

  return NextResponse.redirect(target, 307);
}
