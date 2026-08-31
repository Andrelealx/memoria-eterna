import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/server/rate-limit";

const eventSchema = z.object({
  event: z.enum(["page_view", "cta_click", "template_select", "checkout_start"]),
  path: z.string().startsWith("/").max(200),
  label: z.string().max(60).optional(),
  session: z.string().max(80).optional(),
  campaign: z.string().max(80).optional(),
  utm: z.record(z.string().max(120)).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`analytics:${ip}`, 120, 60_000);
  if (!limit.ok) return new NextResponse(null, { status: 429 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const { event, path, label, session, campaign, utm } = parsed.data;
  const sessionHash = session
    ? createHash("sha256").update(session).digest("hex").slice(0, 32)
    : null;

  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        session: sessionHash,
        campaign,
        utm: { path, label: label ?? null, ...(utm ?? {}) },
      },
    });
  } catch {
    // Métricas nunca devem bloquear a experiência principal.
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
