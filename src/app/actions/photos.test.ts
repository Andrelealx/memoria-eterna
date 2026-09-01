import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const storage = {
    name: "supabase",
    ensureUploadBucket: vi.fn(),
    createSignedUploadUrl: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    signedUrl: vi.fn(),
    remove: vi.fn(),
  };
  return {
    storage,
    currentStorage: storage as Record<string, unknown>,
    projectFindUnique: vi.fn(),
    planFindMany: vi.fn(),
    assetFindMany: vi.fn(),
    assetDeleteMany: vi.fn(),
    assetCount: vi.fn(),
    assetCreate: vi.fn(),
    assetFindFirst: vi.fn(),
    assetFindUnique: vi.fn(),
    assetUpdateMany: vi.fn(),
    assetUpdate: vi.fn(),
    projectUpdate: vi.fn(),
    transaction: vi.fn(),
    publicMediaUrl: vi.fn(),
    rateLimit: vi.fn(),
  };
});

vi.mock("@/lib/adapters/storage/factory", () => ({
  getStorageAdapter: () => mocks.currentStorage,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    project: { findUnique: mocks.projectFindUnique, update: mocks.projectUpdate },
    plan: { findMany: mocks.planFindMany },
    mediaAsset: {
      findMany: mocks.assetFindMany,
      deleteMany: mocks.assetDeleteMany,
      count: mocks.assetCount,
      create: mocks.assetCreate,
      findFirst: mocks.assetFindFirst,
      findUnique: mocks.assetFindUnique,
      updateMany: mocks.assetUpdateMany,
      update: mocks.assetUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/server/media", () => ({
  preferredVariantKey: (asset: { storageKey: string; variants: unknown }) => {
    const variants = asset.variants as { preview?: string } | null;
    return variants?.preview ?? asset.storageKey;
  },
  publicMediaUrl: mocks.publicMediaUrl,
}));

vi.mock("@/lib/server/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { finalizePhotoUpload, preparePhotoUpload } from "./photos";

const draftToken = "rascunho-secreto";
const projectId = "11111111-1111-4111-8111-111111111111";
const assetId = "22222222-2222-4222-8222-222222222222";
const content = {
  schemaVersion: 1,
  niche: "romance",
  creatorName: "",
  recipientName: "",
  title: "",
  relationshipDate: "",
  message: "",
  counterEnabled: true,
  photos: [],
  moments: [],
  music: null,
  finalPhrase: "",
  colorScheme: "vinho",
};

describe("ações de upload direto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentStorage = mocks.storage;
    mocks.storage.ensureUploadBucket.mockResolvedValue(undefined);
    mocks.storage.createSignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://projeto.supabase.co/upload?token=curto",
      storageKey: "temporaria",
      bodyMode: "multipart",
    });
    mocks.storage.remove.mockResolvedValue(undefined);
    mocks.projectFindUnique.mockResolvedValue({
      id: projectId,
      draftToken,
      status: "DRAFT",
      content,
    });
    mocks.planFindMany.mockResolvedValue([
      {
        limits: {
          maxPhotos: 30,
          maxMoments: 12,
          customSlug: true,
          musicEmbed: true,
          editAfterPublish: true,
          qrDownload: true,
          physical: false,
        },
      },
    ]);
    mocks.assetFindMany.mockResolvedValue([]);
    mocks.assetDeleteMany.mockResolvedValue({ count: 0 });
    mocks.assetCount.mockResolvedValue(0);
    mocks.assetCreate.mockResolvedValue({ id: assetId });
    mocks.rateLimit.mockReturnValue({ ok: true, remaining: 39, retryAfterSeconds: 0 });
    mocks.publicMediaUrl.mockResolvedValue("https://midia-assinada.test/foto.webp");
  });

  it("mantém o fallback local sem tentar enviar bytes por URL assinada", async () => {
    mocks.currentStorage = {
      name: "local",
      upload: vi.fn(),
      download: vi.fn(),
      signedUrl: vi.fn(),
      remove: vi.fn(),
    };

    await expect(
      preparePhotoUpload({ draftToken, sizeBytes: 1024, mimeType: "image/jpeg" }),
    ).resolves.toEqual({ mode: "server" });
    expect(mocks.projectFindUnique).not.toHaveBeenCalled();
  });

  it("reserva a mídia antes de entregar a capacidade temporária", async () => {
    const result = await preparePhotoUpload({
      draftToken,
      sizeBytes: 2048,
      mimeType: "image/jpeg",
    });

    expect(mocks.storage.ensureUploadBucket).toHaveBeenCalledOnce();
    expect(mocks.assetCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId,
        status: "PENDING",
        sizeBytes: 2048,
        storageKey: expect.stringMatching(
          /^_incoming\/11111111-1111-4111-8111-111111111111\//,
        ),
      }),
    });
    expect(result).toEqual({
      mode: "direct",
      assetId: expect.any(String),
      uploadUrl: "https://projeto.supabase.co/upload?token=curto",
      bodyMode: "multipart",
    });
    expect(JSON.stringify(result)).not.toContain("service");
  });

  it("não baixa nada quando a reserva não pertence ao rascunho", async () => {
    mocks.assetFindFirst.mockResolvedValue(null);

    await expect(finalizePhotoUpload({ draftToken, assetId })).rejects.toThrow(
      "Reserva de foto não encontrada",
    );
    expect(mocks.storage.download).not.toHaveBeenCalled();
  });

  it("é idempotente depois que a mídia já está pronta", async () => {
    mocks.assetFindFirst.mockResolvedValue({
      id: assetId,
      projectId,
      storageKey: `${projectId}/${assetId}/full.webp`,
      variants: {
        preview: `${projectId}/${assetId}/preview.webp`,
        sourceUploadKey: `_incoming/${projectId}/${assetId}`,
      },
      status: "READY",
      project: { status: "DRAFT" },
    });

    await expect(finalizePhotoUpload({ draftToken, assetId })).resolves.toEqual({
      assetId,
      url: "https://midia-assinada.test/foto.webp",
    });
    expect(mocks.storage.remove).toHaveBeenCalledWith(`_incoming/${projectId}/${assetId}`);
    expect(mocks.storage.download).not.toHaveBeenCalled();
  });

  it("falha com segurança e limpa o temporário se o tamanho real divergir", async () => {
    mocks.assetFindFirst.mockResolvedValue({
      id: assetId,
      projectId,
      storageKey: `_incoming/${projectId}/${assetId}`,
      variants: { sourceUploadKey: `_incoming/${projectId}/${assetId}` },
      mimeType: "image/jpeg",
      sizeBytes: 100,
      status: "PENDING",
      project: { status: "DRAFT" },
    });
    mocks.assetUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    mocks.storage.download.mockResolvedValue(new Uint8Array(99));

    await expect(finalizePhotoUpload({ draftToken, assetId })).rejects.toThrow(
      "incompleto ou foi alterado",
    );
    expect(mocks.storage.remove).toHaveBeenCalledWith(`_incoming/${projectId}/${assetId}`);
    expect(mocks.assetUpdateMany).toHaveBeenLastCalledWith({
      where: { id: assetId, status: "PROCESSING" },
      data: { status: "FAILED" },
    });
  });
});
