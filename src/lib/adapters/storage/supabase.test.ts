import { afterEach, describe, expect, it, vi } from "vitest";
import { SupabaseStorageAdapter } from "./supabase";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SupabaseStorageAdapter", () => {
  it("cria o bucket privado de forma idempotente com limites seguros", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const storage = new SupabaseStorageAdapter("https://bucket-novo.supabase.co", "segredo");

    await storage.ensureUploadBucket();
    await storage.ensureUploadBucket();

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://bucket-novo.supabase.co/storage/v1/bucket/media-originals",
    );
    const create = fetcher.mock.calls[1];
    expect(create[0]).toBe("https://bucket-novo.supabase.co/storage/v1/bucket");
    expect(create[1]?.method).toBe("POST");
    expect(JSON.parse(String(create[1]?.body))).toEqual(
      expect.objectContaining({
        id: "media-originals",
        public: false,
        file_size_limit: 15 * 1024 * 1024,
        allowed_mime_types: expect.arrayContaining(["image/jpeg", "image/heic", "image/webp"]),
      }),
    );
  });

  it("gera ticket assinado sem devolver o service role", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        url: "/object/upload/sign/media-originals/_incoming/projeto/foto?token=capacidade",
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    const storage = new SupabaseStorageAdapter("https://tickets.supabase.co", "service-role");

    const ticket = await storage.createSignedUploadUrl("_incoming/projeto/foto");

    expect(ticket).toEqual({
      storageKey: "_incoming/projeto/foto",
      bodyMode: "multipart",
      uploadUrl:
        "https://tickets.supabase.co/storage/v1/object/upload/sign/media-originals/_incoming/projeto/foto?token=capacidade",
    });
    expect(JSON.stringify(ticket)).not.toContain("service-role");
    expect(fetcher).toHaveBeenCalledWith(
      "https://tickets.supabase.co/storage/v1/object/upload/sign/media-originals/_incoming/projeto/foto",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "service-role",
          Authorization: "Bearer service-role",
        }),
      }),
    );
  });

  it("gera URL privada de leitura com expiração no corpo da requisição", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ signedURL: "/object/sign/media-originals/foto?token=leitura" }),
    );
    vi.stubGlobal("fetch", fetcher);
    const storage = new SupabaseStorageAdapter("https://leitura.supabase.co", "service-role");

    await expect(storage.signedUrl("foto", { expiresInSeconds: 900 })).resolves.toBe(
      "https://leitura.supabase.co/storage/v1/object/sign/media-originals/foto?token=leitura",
    );
    expect(fetcher).toHaveBeenCalledWith(
      "https://leitura.supabase.co/storage/v1/object/sign/media-originals/foto",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ expiresIn: 900 }) }),
    );
  });

  it("interrompe o download quando o objeto declara mais bytes que o permitido", async () => {
    const fetcher = vi.fn(async () =>
      new Response(new Uint8Array(20), {
        status: 200,
        headers: { "content-length": "20" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    const storage = new SupabaseStorageAdapter("https://limite.supabase.co", "segredo");

    await expect(storage.download("grande", { maxBytes: 10 })).rejects.toThrow(
      "excede o limite",
    );
  });

  it("também aplica o teto ao stream quando content-length está ausente", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(8));
        controller.enqueue(new Uint8Array(8));
        controller.close();
      },
    });
    const fetcher = vi.fn(async () => new Response(stream, { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const storage = new SupabaseStorageAdapter("https://stream.supabase.co", "segredo");

    await expect(storage.download("grande", { maxBytes: 10 })).rejects.toThrow(
      "excede o limite",
    );
  });
});
