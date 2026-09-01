import { prisma } from "@/lib/db";
import { getStorageAdapter } from "@/lib/adapters/storage/factory";

// Resolução de mídia para páginas públicas e prévia (seções 11, 15, 18).
// Originais ficam em storage privado; aqui se resolve a URL acessível da
// variante destinada à publicação.

export interface MediaVariants {
  thumbnail?: string;
  preview?: string;
  full?: string;
}

/** URL pública de uma chave de storage (placeholders de seed ou storage privado). */
export async function publicMediaUrl(storageKey: string): Promise<string> {
  if (storageKey.startsWith("placeholders/")) {
    return `/placeholders/${storageKey.slice("placeholders/".length)}`;
  }
  const storage = getStorageAdapter();
  return storage.signedUrl(storageKey, { expiresInSeconds: 3600 });
}

/** Extrai a chave da variante preferida (preview > full > storageKey). */
export function preferredVariantKey(asset: { variants: unknown; storageKey: string }): string {
  const v = asset.variants as MediaVariants | null;
  return v?.preview ?? v?.full ?? asset.storageKey;
}

export interface PublicPhoto {
  assetId: string;
  url: string;
  altText: string;
  position: number;
  isCover: boolean;
}

export interface PhotoRef {
  assetId: string;
  altText: string;
  position: number;
  isCover: boolean;
}

/** Junta as referências de foto do conteúdo às URLs das mídias processadas. */
export async function resolveProjectPhotos(
  projectId: string,
  refs: PhotoRef[],
): Promise<PublicPhoto[]> {
  if (refs.length === 0) return [];

  const assets = await prisma.mediaAsset.findMany({
    where: { projectId, status: "READY" },
  });
  const byId = new Map(assets.map((a) => [a.id, a]));

  const photos = await Promise.all(
    refs.map(async (ref): Promise<PublicPhoto | null> => {
      const asset = byId.get(ref.assetId);
      if (!asset) return null;

      return {
        assetId: ref.assetId,
        url: await publicMediaUrl(preferredVariantKey(asset)),
        altText: ref.altText,
        position: ref.position,
        isCover: ref.isCover,
      };
    }),
  );

  return photos
    .filter((photo): photo is PublicPhoto => photo !== null)
    .sort((a, b) => a.position - b.position);
}
