import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getEnv } from "@/lib/env";
import {
  aiGiftDraftRequestSchema,
  generateDemoGiftDraft,
  generateGiftDraftWithDeepSeek,
} from "@/lib/ai/gift-draft";
import { rateLimit } from "@/lib/server/rate-limit";
import { listActiveTemplates } from "@/lib/server/templates";

export async function POST(request: Request) {
  const ip =
    request.headers.get("cf-connecting-ip")?.trim() ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const limit = rateLimit(`ai-gift-draft:${ip}`, 6, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = aiGiftDraftRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Conte um pouco mais da história para a IA criar algo especial." },
      { status: 400 },
    );
  }

  const env = getEnv();
  const demoEnabled = process.env.NODE_ENV !== "production" && env.DEV_FAKE_AI_ENABLED;
  if (!env.DEEPSEEK_API_KEY && !demoEnabled) {
    return NextResponse.json(
      { ok: false, message: "A criação com IA ainda não está configurada neste ambiente." },
      { status: 503 },
    );
  }

  try {
    const templates = await listActiveTemplates();
    if (templates.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Nenhum modelo está disponível para criar o presente agora." },
        { status: 503 },
      );
    }
    const draft = demoEnabled
      ? generateDemoGiftDraft(parsed.data.prompt, { templates })
      : await generateGiftDraftWithDeepSeek(parsed.data.prompt, {
          apiKey: env.DEEPSEEK_API_KEY!,
          model: env.DEEPSEEK_MODEL,
          tone: parsed.data.tone,
          detailLevel: parsed.data.detailLevel,
          templates,
          signal: request.signal,
        });

    return NextResponse.json(
      { ok: true, draft, mode: demoEnabled ? "demo" : "deepseek" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // O relato do usuário nunca é incluído nos logs ou na resposta de erro.
    if (error instanceof ZodError) {
      console.error("[ai] A resposta da DeepSeek não corresponde ao schema esperado.");
    } else {
      console.error(error instanceof Error ? error.message : "[ai] Falha desconhecida.");
    }
    return NextResponse.json(
      {
        ok: false,
        message: "Não conseguimos criar o rascunho agora. Tente novamente em instantes.",
      },
      { status: 502 },
    );
  }
}
