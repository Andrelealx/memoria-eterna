import { describe, expect, it, vi } from "vitest";
import { uploadPhotoToSignedUrl } from "./photo-upload";

describe("upload direto de fotos", () => {
  it("envia o arquivo por PUT sem qualquer credencial de serviço", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
    const file = new Blob(["imagem"], { type: "image/jpeg" }) as File;

    await uploadPhotoToSignedUrl(
      "https://projeto.supabase.co/storage/v1/object/upload/sign/media-originals/a?token=curto",
      file,
      "multipart",
      fetcher,
    );

    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toContain("token=curto");
    expect(init?.method).toBe("PUT");
    expect(init?.headers).toEqual({ "x-upsert": "false" });
    expect(init?.headers).not.toHaveProperty("Authorization");
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("cacheControl")).toBe("3600");
    const uploaded = (init?.body as FormData).get("") as File;
    expect(uploaded.size).toBe(file.size);
    expect(uploaded.type).toBe(file.type);
  });

  it("recusa URLs sem HTTPS antes de transmitir a foto", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const file = new Blob(["imagem"], { type: "image/jpeg" }) as File;

    await expect(
      uploadPhotoToSignedUrl("http://projeto.supabase.co/upload", file, "multipart", fetcher),
    ).rejects.toThrow("conexão segura");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("transforma falhas do Storage em erro claro e sem corpo remoto", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response("detalhe interno", { status: 413, statusText: "Payload Too Large" }),
    );
    const file = new Blob(["imagem"], { type: "image/jpeg" }) as File;

    await expect(
      uploadPhotoToSignedUrl(
        "https://projeto.supabase.co/storage/v1/object/upload/sign/media-originals/a?token=curto",
        file,
        "multipart",
        fetcher,
      ),
    ).rejects.toThrow("envio direto falhou (413)");
  });

  it("envia bytes brutos e content-type no PUT assinado do Vercel Blob", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
    const file = new Blob(["imagem"], { type: "image/webp" }) as File;

    await uploadPhotoToSignedUrl(
      "https://blob.vercel-storage.com/?vercel-blob-signature=curta",
      file,
      "raw",
      fetcher,
    );

    const [, init] = fetcher.mock.calls[0];
    expect(init?.method).toBe("PUT");
    expect(init?.headers).toEqual({
      "Content-Type": "image/webp",
      "x-content-type": "image/webp",
      "x-vercel-blob-access": "private",
    });
    expect(init?.body).toBe(file);
  });
});
