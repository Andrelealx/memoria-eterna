import type { MediaStorageAdapter, SignedUrlOptions, UploadedMedia } from "./index";

// Adapter Supabase Storage (produção). Requer SUPABASE_SERVICE_ROLE_KEY e
// NEXT_PUBLIC_SUPABASE_URL. Sem credenciais, as operações falham com erro claro.
// Bucket de originais é PRIVADO; acesso público usa URL assinada curta.

const BUCKET = "media-originals";

export class SupabaseStorageAdapter implements MediaStorageAdapter {
  readonly name = "supabase";

  constructor(
    private readonly url: string,
    private readonly serviceRoleKey: string,
  ) {}

  private requireConfig(): { url: string; key: string } {
    if (!this.url || !this.serviceRoleKey) {
      throw new Error(
        "[storage] Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    return { url: this.url, key: this.serviceRoleKey };
  }

  async upload(key: string, body: Uint8Array, contentType: string): Promise<UploadedMedia> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType,
      },
      // `Uint8Array<ArrayBufferLike>` não é aceito diretamente pelo tipo BodyInit do DOM.
      body: body as unknown as BodyInit,
    });
    if (!res.ok) {
      throw new Error(`[storage] upload falhou (${res.status}): ${await res.text()}`);
    }
    return { storageKey: key, mimeType: contentType, sizeBytes: body.length };
  }

  async signedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    const expiresIn = options?.expiresInSeconds ?? 3600;
    const res = await fetch(
      `${url}/storage/v1/object/sign/${BUCKET}/${key}?expiresIn=${expiresIn}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
      },
    );
    if (!res.ok) throw new Error(`[storage] signedUrl falhou (${res.status})`);
    const data = (await res.json()) as { signedURL?: string };
    if (!data.signedURL) throw new Error("[storage] signedUrl: resposta inválida");
    return data.signedURL;
  }

  async remove(key: string): Promise<void> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    await fetch(`${url}/storage/v1/object/${BUCKET}/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceRoleKey}` },
    });
  }
}
