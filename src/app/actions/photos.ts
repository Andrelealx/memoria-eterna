"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getStorageAdapter } from "@/lib/adapters/storage/factory";
import { ALLOWED_IMAGE_MIME, detectImageMime, processImage } from "@/lib/media/image";

// Upload e otimização de fotos (seções 10.3, 18). Verifica MIME real e tamanho,
// remove EXIF, gera variantes WebP e grava em storage privado com nome aleatório.

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export interface UploadPhotoResult {
  assetId: string;
  url: string;
}

export async function uploadPhoto(formData: FormData): Promise<UploadPhotoResult> {
  const draftToken = formData.get("draftToken");
  const file = formData.get("file");

  if (typeof draftToken !== "string" || !draftToken) {
    throw new Error("[upload] Rascunho ausente.");
  }
  if (!(file instanceof File)) {
    throw new Error("[upload] Arquivo ausente.");
  }

  const project = await prisma.project.findUnique({ where: { draftToken } });
  if (!project) throw new Error("[upload] Rascunho não encontrado.");

  const input = Buffer.from(await file.arrayBuffer());
  if (input.length === 0) throw new Error("[upload] Arquivo vazio.");
  if (input.length > MAX_UPLOAD_BYTES) throw new Error("[upload] Arquivo muito grande (máx. 15 MB).");

  const mime = detectImageMime(input);
  if (!mime || !ALLOWED_IMAGE_MIME.has(mime)) {
    throw new Error("[upload] Formato não permitido (use JPEG, PNG, WebP ou HEIC).");
  }

  const baseKey = `${project.id}/${randomUUID()}`;
  const processed = await processImage(input, baseKey);

  const storage = getStorageAdapter();
  await storage.upload(processed.full.key, processed.full.buffer, "image/webp");
  await storage.upload(processed.preview.key, processed.preview.buffer, "image/webp");
  await storage.upload(processed.thumbnail.key, processed.thumbnail.buffer, "image/webp");

  const asset = await prisma.mediaAsset.create({
    data: {
      projectId: project.id,
      storageKey: processed.full.key,
      mimeType: "image/webp",
      sizeBytes: processed.full.sizeBytes,
      width: processed.width,
      height: processed.height,
      status: "READY",
      variants: {
        full: processed.full.key,
        preview: processed.preview.key,
        thumbnail: processed.thumbnail.key,
      },
    },
  });

  // URL de prévia local (dev) ou assinada (prod) — reutiliza a resolução de mídia.
  const { publicMediaUrl } = await import("@/lib/server/media");
  const url = await publicMediaUrl(processed.preview.key);

  return { assetId: asset.id, url };
}
