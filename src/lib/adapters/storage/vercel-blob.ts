import { del, get, issueSignedToken, presignUrl, put } from "@vercel/blob";
import type {
  DownloadOptions,
  MediaStorageAdapter,
  SignedUpload,
  SignedUrlOptions,
  UploadedMedia,
} from "./index";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
// Identificador público do store conectado a este projeto. O override por env
// mantém o adapter portátil; o fallback garante OIDC mesmo quando a integração
// não materializa BLOB_STORE_ID nas variáveis visíveis da Function.
const DEFAULT_STORE_ID = "store_eY8FZ2elQM5KSkDJ";
const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/octet-stream",
];

async function readBounded(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
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

/**
 * Storage privado principal na Vercel. O SDK resolve automaticamente OIDC
 * (`VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID`) nas Functions e continua aceitando
 * `BLOB_READ_WRITE_TOKEN` em ambientes antigos/locais.
 */
export class VercelBlobStorageAdapter implements MediaStorageAdapter {
  readonly name = "vercel-blob";

  private readonly storeId = process.env.BLOB_STORE_ID || DEFAULT_STORE_ID;

  async ensureUploadBucket(): Promise<void> {
    // O store privado é provisionado/conectado no projeto pela Vercel. A
    // autenticação OIDC é curta e renovada automaticamente pelo runtime.
  }

  async upload(key: string, body: Uint8Array, contentType: string): Promise<UploadedMedia> {
    const uploaded = await put(key, Buffer.from(body), {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
      maximumSizeInBytes: MAX_UPLOAD_BYTES,
      storeId: this.storeId,
    });
    return {
      storageKey: uploaded.pathname,
      mimeType: contentType,
      sizeBytes: body.byteLength,
    };
  }

  async download(key: string, options: DownloadOptions): Promise<Uint8Array> {
    const result = await get(key, {
      access: "private",
      useCache: false,
      storeId: this.storeId,
    });
    if (!result || result.statusCode !== 200) {
      throw new Error("[storage] Objeto não encontrado.");
    }
    if (result.blob.size > options.maxBytes) {
      await result.stream.cancel();
      throw new Error("[storage] Objeto excede o limite permitido.");
    }
    return readBounded(result.stream, options.maxBytes);
  }

  async createSignedUploadUrl(key: string): Promise<SignedUpload> {
    const validUntil = Date.now() + 15 * 60_000;
    const signedToken = await issueSignedToken({
      pathname: key,
      operations: ["put"],
      validUntil,
      allowedContentTypes: ALLOWED_IMAGE_MIME_TYPES,
      maximumSizeInBytes: MAX_UPLOAD_BYTES,
      storeId: this.storeId,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      access: "private",
      operation: "put",
      pathname: key,
      validUntil,
      allowedContentTypes: ALLOWED_IMAGE_MIME_TYPES,
      maximumSizeInBytes: MAX_UPLOAD_BYTES,
      allowOverwrite: false,
      addRandomSuffix: false,
      cacheControlMaxAge: 3600,
    });
    return { uploadUrl: presignedUrl, storageKey: key, bodyMode: "raw" };
  }

  async signedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const validUntil = Date.now() + (options?.expiresInSeconds ?? 3600) * 1000;
    const signedToken = await issueSignedToken({
      pathname: key,
      operations: ["get"],
      validUntil,
      storeId: this.storeId,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      access: "private",
      operation: "get",
      pathname: key,
      validUntil,
    });
    return presignedUrl;
  }

  async remove(key: string): Promise<void> {
    await del(key, { storeId: this.storeId });
  }
}
