"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import type { MediaStorageAdapter } from "@/lib/adapters/storage";
import { getStorageAdapter } from "@/lib/adapters/storage/factory";
import { parseProjectContent } from "@/lib/domain/projects";
import { ABSOLUTE_MAX_PROJECT_PHOTOS, isProjectStatusEditable, planLimitsSchema } from "@/lib/domain/plans";
import { ALLOWED_IMAGE_MIME, detectImageMime, processImage } from "@/lib/media/image";
import { preferredVariantKey, publicMediaUrl } from "@/lib/server/media";
import { rateLimit } from "@/lib/server/rate-limit";

// Upload e otimização de fotos (seções 10.3, 18). Verifica MIME real e tamanho,
// remove EXIF, gera variantes WebP e grava em storage privado com nome aleatório.

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
const DIRECT_UPLOAD_PREFIX = "_incoming";
const SIGNED_UPLOAD_TTL_MS = 2 * 60 * 60_000;
const VERCEL_BLOB_RESERVATION_TTL_MS = 30 * 60_000;

export interface UploadPhotoResult {
  assetId: string;
  url: string;
}

export type PreparePhotoUploadResult =
  | { mode: "server" }
  | {
      mode: "direct";
      assetId: string;
      uploadUrl: string;
      bodyMode: "raw" | "multipart";
    };

function configuredMaxPhotos(activePlans: Array<{ limits: unknown }>): number {
  const configuredMax = Math.max(
    0,
    ...activePlans.flatMap((plan) => {
      const parsed = planLimitsSchema.safeParse(plan.limits);
      return parsed.success ? [parsed.data.maxPhotos] : [];
    }),
  );
  return Math.min(
    ABSOLUTE_MAX_PROJECT_PHOTOS,
    configuredMax || ABSOLUTE_MAX_PROJECT_PHOTOS,
  );
}

function directUploadKey(projectId: string, assetId: string): string {
  return `${DIRECT_UPLOAD_PREFIX}/${projectId}/${assetId}`;
}

function readVariantString(variants: unknown, key: string): string | null {
  if (!variants || typeof variants !== "object" || Array.isArray(variants)) return null;
  const value = (variants as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

async function removeQuietly(storage: MediaStorageAdapter, keys: string[]): Promise<void> {
  await Promise.allSettled(keys.map((key) => storage.remove(key)));
}

async function readyPhotoResult(asset: {
  id: string;
  storageKey: string;
  variants: unknown;
}): Promise<UploadPhotoResult> {
  return {
    assetId: asset.id,
    url: await publicMediaUrl(preferredVariantKey(asset)),
  };
}

/**
 * Reserva um objeto temporário e cria uma URL de upload direto no Supabase.
 * O service role fica exclusivamente no adapter servidor; o navegador recebe
 * apenas a capacidade temporária criada pelo próprio Storage.
 */
export async function preparePhotoUpload(input: {
  draftToken: string;
  sizeBytes: number;
  mimeType: string;
}): Promise<PreparePhotoUploadResult> {
  if (!input || typeof input.draftToken !== "string" || !input.draftToken) {
    throw new Error("[upload] Rascunho ausente.");
  }
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new Error("[upload] Arquivo vazio.");
  }
  if (input.sizeBytes > MAX_UPLOAD_BYTES) {
    throw new Error("[upload] Arquivo muito grande (máx. 15 MB).");
  }
  if (typeof input.mimeType !== "string" || input.mimeType.length > 100) {
    throw new Error("[upload] Tipo de arquivo inválido.");
  }

  const storage = getStorageAdapter();
  if (!storage.createSignedUploadUrl) return { mode: "server" };

  const [project, activePlans] = await Promise.all([
    prisma.project.findUnique({ where: { draftToken: input.draftToken }, include: { plan: true } }),
    prisma.plan.findMany({ where: { active: true }, select: { limits: true } }),
  ]);
  if (!project || !isProjectStatusEditable(project.status, project.plan?.limits)) {
    throw new Error("[upload] Rascunho não encontrado.");
  }
  await storage.ensureUploadBucket?.();

  const limit = rateLimit(`photo-upload:${input.draftToken}`, 40, 10 * 60_000);
  if (!limit.ok) {
    throw new Error(
      `[upload] Muitas fotos em sequência. Aguarde ${limit.retryAfterSeconds} segundos.`,
    );
  }

  // URLs assinadas do Supabase expiram em duas horas. Reservas mais antigas não
  // podem mais ser usadas e são retiradas para não bloquear o limite do presente.
  const reservationTtl =
    storage.name === "vercel-blob" ? VERCEL_BLOB_RESERVATION_TTL_MS : SIGNED_UPLOAD_TTL_MS;
  const staleBefore = new Date(Date.now() - reservationTtl);
  const stale = await prisma.mediaAsset.findMany({
    where: {
      projectId: project.id,
      status: "PENDING",
      createdAt: { lt: staleBefore },
      storageKey: { startsWith: `${DIRECT_UPLOAD_PREFIX}/${project.id}/` },
    },
    select: { id: true, storageKey: true },
  });
  if (stale.length > 0) {
    await removeQuietly(
      storage,
      stale.map((asset) => asset.storageKey),
    );
    await prisma.mediaAsset.deleteMany({
      where: { id: { in: stale.map((asset) => asset.id) }, status: "PENDING" },
    });
  }

  const maxPhotos = configuredMaxPhotos(activePlans);
  const content = parseProjectContent(project.content);
  const reservations = await prisma.mediaAsset.count({
    where: { projectId: project.id, status: { in: ["PENDING", "PROCESSING"] } },
  });
  if (content.photos.length + reservations >= maxPhotos) {
    throw new Error(`[upload] Este presente já atingiu o limite de ${maxPhotos} fotos.`);
  }

  const assetId = randomUUID();
  const storageKey = directUploadKey(project.id, assetId);
  await prisma.mediaAsset.create({
    data: {
      id: assetId,
      projectId: project.id,
      storageKey,
      mimeType: input.mimeType || "application/octet-stream",
      sizeBytes: input.sizeBytes,
      position: content.photos.length + reservations,
      altText: "",
      status: "PENDING",
      variants: { sourceUploadKey: storageKey },
    },
  });

  try {
    const ticket = await storage.createSignedUploadUrl(storageKey);
    return {
      mode: "direct",
      assetId,
      uploadUrl: ticket.uploadUrl,
      bodyMode: ticket.bodyMode,
    };
  } catch (cause) {
    await prisma.mediaAsset.deleteMany({ where: { id: assetId, status: "PENDING" } });
    throw cause;
  }
}

/**
 * Conclui um upload direto. A ação recebe somente identificadores pequenos;
 * os bytes são lidos do bucket privado com teto rígido e nunca atravessam o
 * limite de corpo das Functions da Vercel.
 */
export async function finalizePhotoUpload(input: {
  draftToken: string;
  assetId: string;
}): Promise<UploadPhotoResult> {
  if (!input || typeof input.draftToken !== "string" || !input.draftToken) {
    throw new Error("[upload] Rascunho ausente.");
  }
  if (typeof input.assetId !== "string" || !input.assetId) {
    throw new Error("[upload] Reserva de foto ausente.");
  }

  let asset = await prisma.mediaAsset.findFirst({
    where: { id: input.assetId, project: { draftToken: input.draftToken } },
    include: { project: { include: { plan: true } } },
  });
  if (!asset || !isProjectStatusEditable(asset.project.status, asset.project.plan?.limits)) {
    throw new Error("[upload] Reserva de foto não encontrada.");
  }

  const storage = getStorageAdapter();
  if (asset.status === "READY") {
    const sourceUploadKey = readVariantString(asset.variants, "sourceUploadKey");
    if (sourceUploadKey) await removeQuietly(storage, [sourceUploadKey]);
    return readyPhotoResult(asset);
  }
  if (asset.status === "FAILED") {
    throw new Error("[upload] Esta foto não pôde ser processada. Envie-a novamente.");
  }
  if (asset.status === "PROCESSING") {
    throw new Error("[upload] Esta foto ainda está sendo processada. Tente novamente.");
  }

  const expectedUploadKey = directUploadKey(asset.projectId, asset.id);
  if (asset.storageKey !== expectedUploadKey) {
    throw new Error("[upload] Reserva de foto inválida.");
  }
  const claimed = await prisma.mediaAsset.updateMany({
    where: { id: asset.id, status: "PENDING" },
    data: { status: "PROCESSING" },
  });
  if (claimed.count !== 1) {
    asset = await prisma.mediaAsset.findFirst({
      where: { id: input.assetId, project: { draftToken: input.draftToken } },
      include: { project: { include: { plan: true } } },
    });
    if (asset?.status === "READY") return readyPhotoResult(asset);
    throw new Error("[upload] Esta foto ainda está sendo processada. Tente novamente.");
  }

  const storedKeys: string[] = [];
  let committed = false;
  try {
    const uploaded = Buffer.from(
      await storage.download(expectedUploadKey, { maxBytes: MAX_UPLOAD_BYTES }),
    );
    if (uploaded.length === 0) throw new Error("[upload] Arquivo vazio.");
    if (uploaded.length !== asset.sizeBytes) {
      throw new Error("[upload] O arquivo recebido está incompleto ou foi alterado.");
    }
    const mime = detectImageMime(uploaded);
    if (!mime || !ALLOWED_IMAGE_MIME.has(mime)) {
      throw new Error("[upload] Formato não permitido (use JPEG, PNG, WebP ou HEIC).");
    }

    const processed = await processImage(
      uploaded,
      `${asset.projectId}/${asset.id}/${randomUUID()}`,
    );
    await storage.upload(processed.full.key, processed.full.buffer, "image/webp");
    storedKeys.push(processed.full.key);
    await storage.upload(processed.preview.key, processed.preview.buffer, "image/webp");
    storedKeys.push(processed.preview.key);
    await storage.upload(processed.thumbnail.key, processed.thumbnail.buffer, "image/webp");
    storedKeys.push(processed.thumbnail.key);

    const activePlans = await prisma.plan.findMany({
      where: { active: true },
      select: { limits: true },
    });
    const maxPhotos = configuredMaxPhotos(activePlans);
    await prisma.$transaction(async (tx) => {
      const [latestProject, latestAsset] = await Promise.all([
        tx.project.findUnique({ where: { id: asset!.projectId }, include: { plan: true } }),
        tx.mediaAsset.findUnique({ where: { id: asset!.id } }),
      ]);
      if (!latestProject || !isProjectStatusEditable(latestProject.status, latestProject.plan?.limits)) {
        throw new Error("[upload] Rascunho não encontrado.");
      }
      if (!latestAsset || latestAsset.status !== "PROCESSING") {
        throw new Error("[upload] A reserva desta foto expirou.");
      }
      const latestContent = parseProjectContent(latestProject.content);
      const alreadyReferenced = latestContent.photos.some((photo) => photo.assetId === asset!.id);
      if (!alreadyReferenced && latestContent.photos.length >= maxPhotos) {
        throw new Error(`[upload] Este presente já atingiu o limite de ${maxPhotos} fotos.`);
      }

      await tx.mediaAsset.update({
        where: { id: asset!.id },
        data: {
          storageKey: processed.full.key,
          mimeType: "image/webp",
          sizeBytes: processed.full.sizeBytes,
          width: processed.width,
          height: processed.height,
          position: alreadyReferenced
            ? latestAsset.position
            : latestContent.photos.length,
          status: "READY",
          variants: {
            full: processed.full.key,
            preview: processed.preview.key,
            thumbnail: processed.thumbnail.key,
            sourceUploadKey: expectedUploadKey,
          },
        },
      });

      if (!alreadyReferenced) {
        await tx.project.update({
          where: { id: latestProject.id },
          data: {
            content: {
              ...latestContent,
              photos: [
                ...latestContent.photos,
                {
                  assetId: asset!.id,
                  altText: "",
                  position: latestContent.photos.length,
                  isCover: latestContent.photos.every((photo) => !photo.isCover),
                },
              ],
            },
          },
        });
      }
    });
    committed = true;
    await removeQuietly(storage, [expectedUploadKey]);
    return {
      assetId: asset.id,
      url: await publicMediaUrl(processed.preview.key),
    };
  } catch (cause) {
    if (!committed) {
      await removeQuietly(storage, [...storedKeys, expectedUploadKey]);
      await prisma.mediaAsset.updateMany({
        where: { id: asset.id, status: "PROCESSING" },
        data: { status: "FAILED" },
      });
    }
    throw cause;
  }
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
    prisma.project.findUnique({ where: { draftToken }, include: { plan: true } }),
    prisma.plan.findMany({ where: { active: true }, select: { limits: true } }),
  ]);
  if (!project || !isProjectStatusEditable(project.status, project.plan?.limits)) {
    throw new Error("[upload] Rascunho não encontrado.");
  }

  const limit = rateLimit(`photo-upload:${draftToken}`, 40, 10 * 60_000);
  if (!limit.ok) {
    throw new Error(
      `[upload] Muitas fotos em sequência. Aguarde ${limit.retryAfterSeconds} segundos.`,
    );
  }

  const maxPhotos = configuredMaxPhotos(activePlans);
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
      const latestProject = await tx.project.findUnique({
        where: { id: project.id },
        include: { plan: true },
      });
      if (!latestProject || !isProjectStatusEditable(latestProject.status, latestProject.plan?.limits)) {
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
