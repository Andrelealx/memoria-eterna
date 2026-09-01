import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  issueSignedToken: vi.fn(),
  presignUrl: vi.fn(),
}));

vi.mock("@vercel/blob", () => mocks);

import { VercelBlobStorageAdapter } from "./vercel-blob";

describe("VercelBlobStorageAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.issueSignedToken.mockResolvedValue({
      delegationToken: "delegacao",
      clientSigningToken: "assinatura",
      validUntil: Date.now() + 60_000,
    });
    mocks.presignUrl.mockResolvedValue({
      presignedUrl: "https://blob.vercel-storage.com/?vercel-blob-signature=curta",
    });
  });

  it("emite PUT restrito ao pathname, tipos de imagem e 15 MB", async () => {
    const storage = new VercelBlobStorageAdapter();

    await expect(storage.createSignedUploadUrl("_incoming/projeto/foto")).resolves.toEqual({
      uploadUrl: "https://blob.vercel-storage.com/?vercel-blob-signature=curta",
      storageKey: "_incoming/projeto/foto",
      bodyMode: "raw",
    });
    expect(mocks.issueSignedToken).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "_incoming/projeto/foto",
        operations: ["put"],
        maximumSizeInBytes: 15 * 1024 * 1024,
        allowedContentTypes: expect.arrayContaining(["image/jpeg", "image/heic"]),
      }),
    );
    expect(mocks.presignUrl).toHaveBeenCalledWith(
      expect.objectContaining({ delegationToken: "delegacao" }),
      expect.objectContaining({
        access: "private",
        operation: "put",
        pathname: "_incoming/projeto/foto",
        allowOverwrite: false,
        addRandomSuffix: false,
      }),
    );
  });

  it("gera uma URL de leitura temporária para o blob privado", async () => {
    const storage = new VercelBlobStorageAdapter();

    await expect(storage.signedUrl("projeto/preview.webp", { expiresInSeconds: 600 })).resolves.toBe(
      "https://blob.vercel-storage.com/?vercel-blob-signature=curta",
    );
    expect(mocks.issueSignedToken).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "projeto/preview.webp", operations: ["get"] }),
    );
    expect(mocks.presignUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ access: "private", operation: "get" }),
    );
  });

  it("grava variantes privadas via OIDC implícito", async () => {
    mocks.put.mockResolvedValue({ pathname: "projeto/full.webp" });
    const storage = new VercelBlobStorageAdapter();
    const body = new Uint8Array([1, 2, 3]);

    await expect(storage.upload("projeto/full.webp", body, "image/webp")).resolves.toEqual({
      storageKey: "projeto/full.webp",
      mimeType: "image/webp",
      sizeBytes: 3,
    });
    expect(mocks.put).toHaveBeenCalledWith(
      "projeto/full.webp",
      expect.any(Uint8Array),
      expect.objectContaining({
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
      }),
    );
    expect(Array.from(mocks.put.mock.calls[0][1] as Uint8Array)).toEqual([1, 2, 3]);
  });

  it("lê a mídia privada sem cache e aplica o teto antes de bufferizar", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    });
    mocks.get.mockResolvedValue({ statusCode: 200, stream, blob: { size: 3 } });
    const storage = new VercelBlobStorageAdapter();

    await expect(storage.download("_incoming/foto", { maxBytes: 10 })).resolves.toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(mocks.get).toHaveBeenCalledWith("_incoming/foto", {
      access: "private",
      useCache: false,
      storeId: "store_eY8FZ2elQM5KSkDJ",
    });
  });

  it("remove temporários e variantes pelo pathname privado", async () => {
    mocks.del.mockResolvedValue(undefined);
    const storage = new VercelBlobStorageAdapter();

    await storage.remove("_incoming/foto");
    expect(mocks.del).toHaveBeenCalledWith("_incoming/foto", {
      storeId: "store_eY8FZ2elQM5KSkDJ",
    });
  });
});
