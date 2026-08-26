import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Servidor de mídia LOCAL — SOMENTE desenvolvimento/teste (adapter LocalStorageAdapter).
// Em produção o acesso é feito por URLs assinadas do Supabase Storage (ver docs/DEPLOYMENT.md).

const MEDIA_ROOT = path.join(process.cwd(), ".media");

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { path: segments } = await ctx.params;
  // Impede path traversal: reconstrói apenas com segmentos seguros.
  const safe = segments.map((s) => s.replace(/[^a-zA-Z0-9._-]/g, "")).join("/");
  const filePath = path.join(MEDIA_ROOT, safe);

  // Garante que o caminho resolvido permanece dentro de .media/.
  if (!filePath.startsWith(MEDIA_ROOT)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });

    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    const stream = createReadStream(filePath);
    return new Response(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
