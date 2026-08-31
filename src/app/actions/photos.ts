"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getStorageAdapter } from "@/lib/adapters/storage/factory";
import { parseProjectContent } from "@/lib/domain/projects";
import { ABSOLUTE_MAX_PROJECT_PHOTOS, planLimitsSchema } from "@/lib/domain/plans";
import { ALLOWED_IMAGE_MIME, detectImageMime, processImage } from "@/lib/media/image";
import { publicMediaUrl } from "@/lib/server/media";
import { rateLimit } from "@/lib/server/rate-limit";

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
  if (file.size === 0) throw new Error("[upload] Arquivo vazio.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("[upload] Arquivo muito grande (máx. 15 MB).");
  }

  const [project, activePlans] = await Promise.all([
    prisma.project.findUnique({ where: { draftToken } }),
    prisma.plan.findMany({ where: { active: true }, select: { limits: true } }),
  ]);
  if (!project || project.status !== "DRAFT") {
    throw new Error("[upload] Rascunho não encontrado.");
  }

  const limit = rateLimit(`photo-upload:${draftToken}`, 40, 10 * 60_000);
  if (!limit.ok) {
    throw new Error(
      `[upload] Muitas fotos em sequência. Aguarde ${limit.retryAfterSeconds} segundos.`,
    );
  }

  const configuredMax = Math.max(
    0,
    ...activePlans.flatMap((plan) => {
      const parsed = planLimitsSchema.safeParse(plan.limits);
      return parsed.success ? [parsed.data.maxPhotos] : [];
    }),
  );
  const maxPhotos = Math.min(
    ABSOLUTE_MAX_PROJECT_PHOTOS,
    configuredMax || ABSOLUTE_MAX_PROJECT_PHOTOS,
  );
  const currentContent = parseProjectContent(project.content);
  if (currentContent.photos.length >= maxPhotos) {
    throw new Error(`[upload] Este presente já atingiu o limite de ${maxPhotos} fotos.`);
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (input.length === 0) throw new Error("[upload] Arquivo vazio.");
  if (input.length > MAX_UPLOAD_BYTES) {
    throw new Error("[upload] Arquivo muito grande (máx. 15 MB).");
  }

  const mime = detectImageMime(input);
  if (!mime || !ALLOWED_IMAGE_MIME.has(mime)) {
    throw new Error("[upload] Formato não permitido (use JPEG, PNG, WebP ou HEIC).");
  }

  const baseKey = `${project.id}/${randomUUID()}`;
  const processed = await processImage(input, baseKey);

  const storage = getStorageAdapter();
  const storedKeys: string[] = [];
  try {
    await storage.upload(processed.full.key, processed.full.buffer, "image/webp");
    storedKeys.push(processed.full.key);
    await storage.upload(processed.preview.key, processed.preview.buffer, "image/webp");
    storedKeys.push(processed.preview.key);
    await storage.upload(processed.thumbnail.key, processed.thumbnail.buffer, "image/webp");
    storedKeys.push(processed.thumbnail.key);
    const url = await publicMediaUrl(processed.preview.key);

    // A referência entra no rascunho no mesmo commit que registra o asset. Assim,
    // fechar a aba durante um lote não faz uma foto já concluída desaparecer.
    const asset = await prisma.$transaction(async (tx) => {
      const latestProject = await tx.project.findUnique({ where: { id: project.id } });
      if (!latestProject || latestProject.status !== "DRAFT") {
        throw new Error("[upload] Rascunho não encontrado.");
      }
      const latestContent = parseProjectContent(latestProject.content);
      if (latestContent.photos.length >= maxPhotos) {
        throw new Error(`[upload] Este presente já atingiu o limite de ${maxPhotos} fotos.`);
      }

      const created = await tx.mediaAsset.create({
        data: {
          projectId: project.id,
          storageKey: processed.full.key,
          mimeType: "image/webp",
          sizeBytes: processed.full.sizeBytes,
          width: processed.width,
          height: processed.height,
          position: latestContent.photos.length,
          altText: "",
          status: "READY",
          variants: {
            full: processed.full.key,
            preview: processed.preview.key,
            thumbnail: processed.thumbnail.key,
          },
        },
      });

      await tx.project.update({
        where: { id: latestProject.id },
        data: {
          content: {
            ...latestContent,
            photos: [
              ...latestContent.photos,
              {
                assetId: created.id,
                altText: "",
                position: latestContent.photos.length,
                isCover: latestContent.photos.every((photo) => !photo.isCover),
              },
            ],
          },
        },
      });

      return created;
    });

    return { assetId: asset.id, url };
  } catch (cause) {
    await Promise.allSettled(storedKeys.map((key) => storage.remove(key)));
    throw cause;
  }
}
