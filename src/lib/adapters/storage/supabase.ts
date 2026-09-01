import type {
  DownloadOptions,
  MediaStorageAdapter,
  SignedUpload,
  SignedUrlOptions,
  UploadedMedia,
} from "./index";

// Adapter Supabase Storage (produção). Requer SUPABASE_SERVICE_ROLE_KEY e
// NEXT_PUBLIC_SUPABASE_URL. Sem credenciais, as operações falham com erro claro.
// Bucket de originais é PRIVADO; acesso público usa URL assinada curta.

const BUCKET = "media-originals";
const MAX_BUCKET_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_BUCKET_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  // Alguns navegadores enviam HEIC sem MIME. A validação definitiva usa magic bytes.
  "application/octet-stream",
];
const bucketInitialization = new Map<string, Promise<void>>();

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

  private serviceHeaders(serviceRoleKey: string): Record<string, string> {
    return {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    };
  }

  async ensureUploadBucket(): Promise<void> {
    const { url } = this.requireConfig();
    const cached = bucketInitialization.get(url);
    if (cached) return cached;

    const initialization = this.initializeUploadBucket();
    bucketInitialization.set(url, initialization);
    try {
      await initialization;
    } catch (cause) {
      bucketInitialization.delete(url);
      throw cause;
    }
  }

  private async initializeUploadBucket(): Promise<void> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    const storageBase = `${url}/storage/v1`;
    const headers = {
      ...this.serviceHeaders(serviceRoleKey),
      "Content-Type": "application/json",
    };
    const configuration = {
      id: BUCKET,
      name: BUCKET,
      public: false,
      file_size_limit: MAX_BUCKET_FILE_BYTES,
      allowed_mime_types: ALLOWED_BUCKET_MIME_TYPES,
    };

    const current = await fetch(`${storageBase}/bucket/${BUCKET}`, { headers });
    if (current.ok) {
      const updated = await fetch(`${storageBase}/bucket/${BUCKET}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(configuration),
      });
      if (!updated.ok) {
        throw new Error(`[storage] configuração do bucket falhou (${updated.status}).`);
      }
      return;
    }
    if (current.status !== 404 && current.status !== 400) {
      throw new Error(`[storage] consulta do bucket falhou (${current.status}).`);
    }

    const created = await fetch(`${storageBase}/bucket`, {
      method: "POST",
      headers,
      body: JSON.stringify(configuration),
    });
    if (created.ok) return;

    // Duas instâncias frias podem tentar criar simultaneamente. Se outra venceu,
    // reafirma a configuração privada em vez de falhar o upload do cliente.
    if (created.status === 409 || created.status === 400) {
      const updated = await fetch(`${storageBase}/bucket/${BUCKET}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(configuration),
      });
      if (updated.ok) return;
    }
    throw new Error(`[storage] criação do bucket falhou (${created.status}).`);
  }

  async upload(key: string, body: Uint8Array, contentType: string): Promise<UploadedMedia> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${key}`, {
      method: "POST",
      headers: {
        ...this.serviceHeaders(serviceRoleKey),
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

  async download(key: string, options: DownloadOptions): Promise<Uint8Array> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${key}`, {
      headers: this.serviceHeaders(serviceRoleKey),
    });
    if (!res.ok) {
      throw new Error(`[storage] download falhou (${res.status}): ${await res.text()}`);
    }

    const declaredLength = Number(res.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > options.maxBytes) {
      await res.body?.cancel();
      throw new Error("[storage] Objeto excede o limite permitido.");
    }
    if (!res.body) throw new Error("[storage] download sem conteúdo.");

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > options.maxBytes) {
        await reader.cancel();
        throw new Error("[storage] Objeto excede o limite permitido.");
      }
      chunks.push(value);
    }

    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return body;
  }

  async createSignedUploadUrl(key: string): Promise<SignedUpload> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    const storageBase = `${url}/storage/v1`;
    const res = await fetch(`${storageBase}/object/upload/sign/${BUCKET}/${key}`, {
      method: "POST",
      headers: {
        ...this.serviceHeaders(serviceRoleKey),
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!res.ok) {
      throw new Error(`[storage] assinatura de upload falhou (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as { url?: string };
    if (!data.url) throw new Error("[storage] assinatura de upload inválida.");
    const uploadUrl = data.url.startsWith("http")
      ? data.url
      : `${storageBase}${data.url.startsWith("/") ? "" : "/"}${data.url}`;
    return { uploadUrl, storageKey: key, bodyMode: "multipart" };
  }

  async signedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    const expiresIn = options?.expiresInSeconds ?? 3600;
    const storageBase = `${url}/storage/v1`;
    const res = await fetch(
      `${storageBase}/object/sign/${BUCKET}/${key}`,
      {
        method: "POST",
        headers: {
          ...this.serviceHeaders(serviceRoleKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn }),
      },
    );
    if (!res.ok) throw new Error(`[storage] signedUrl falhou (${res.status})`);
    const data = (await res.json()) as { signedURL?: string };
    if (!data.signedURL) throw new Error("[storage] signedUrl: resposta inválida");
    return data.signedURL.startsWith("http")
      ? data.signedURL
      : `${storageBase}${data.signedURL.startsWith("/") ? "" : "/"}${data.signedURL}`;
  }

  async remove(key: string): Promise<void> {
    const { url, key: serviceRoleKey } = this.requireConfig();
    const res = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: {
        ...this.serviceHeaders(serviceRoleKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: [key] }),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`[storage] remoção falhou (${res.status}).`);
    }
  }
}
