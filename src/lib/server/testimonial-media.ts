import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Storage de mídia de depoimentos (seção de prova social). Diferente das fotos
// de projeto (privadas, servidas por URL assinada), aqui o resultado precisa
// ser uma URL pública permanente: a home é uma página de marketing cacheada,
// então uma URL assinada com expiração quebraria a imagem depois de um tempo.

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Mesmo store privado usado pelas fotos de projeto — só muda o `access` do
// objeto, não o store. Ver vercel-blob.ts.
const DEFAULT_STORE_ID = "store_eY8FZ2elQM5KSkDJ";

function hasVercelBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) || process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

export interface UploadedTestimonialMedia {
  url: string;
}

/** Recebe bytes já validados (tamanho/tipo) e devolve uma URL pública permanente. */
export async function uploadTestimonialMedia(
  body: Uint8Array,
  contentType: string,
): Promise<UploadedTestimonialMedia> {
  const ext = ALLOWED_MIME[contentType];
  if (!ext) throw new Error("[testimonial] Tipo de arquivo não suportado.");
  if (body.byteLength > MAX_BYTES) throw new Error("[testimonial] Arquivo excede o limite de 15MB.");

  const key = `testimonials/${randomUUID()}.${ext}`;

  if (hasVercelBlob()) {
    const { put } = await import("@vercel/blob");
    const uploaded = await put(key, Buffer.from(body), {
      access: "public",
      contentType,
      addRandomSuffix: false,
      storeId: process.env.BLOB_STORE_ID || DEFAULT_STORE_ID,
    });
    return { url: uploaded.url };
  }

  // Dev local sem Vercel Blob: grava em public/ para ser servido estaticamente.
  const dir = path.join(process.cwd(), "public", "testimonials");
  await mkdir(dir, { recursive: true });
  const filename = path.basename(key);
  await writeFile(path.join(dir, filename), body);
  return { url: `/testimonials/${filename}` };
}

/** Remove a mídia (best-effort — nunca bloqueia a exclusão do depoimento). */
export async function removeTestimonialMedia(url: string): Promise<void> {
  try {
    if (url.startsWith("/testimonials/")) {
      const filePath = path.join(process.cwd(), "public", url);
      await unlink(filePath);
      return;
    }
    if (hasVercelBlob()) {
      const { del } = await import("@vercel/blob");
      await del(url, { storeId: process.env.BLOB_STORE_ID || DEFAULT_STORE_ID });
    }
  } catch {
    // best-effort
  }
}
