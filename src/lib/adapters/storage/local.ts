import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DownloadOptions, MediaStorageAdapter, UploadedMedia } from "./index";

// Adapter de armazenamento LOCAL — SOMENTE desenvolvimento/teste.
// Grava arquivos em `.media/` (gitignored). Em produção usa Supabase Storage.

const ROOT = path.join(process.cwd(), ".media");

export class LocalStorageAdapter implements MediaStorageAdapter {
  readonly name = "local";

  private resolve(key: string): string {
    // Impede path traversal: mantém apenas o basename sanitizado.
    const safe = key.replace(/[^a-zA-Z0-9._/-]/g, "");
    return path.join(ROOT, safe);
  }

  async upload(key: string, body: Uint8Array, contentType: string): Promise<UploadedMedia> {
    const dest = this.resolve(key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, body);
    return { storageKey: key, mimeType: contentType, sizeBytes: body.length };
  }

  async download(key: string, options: DownloadOptions): Promise<Uint8Array> {
    const body = await readFile(this.resolve(key));
    if (body.length > options.maxBytes) {
      throw new Error("[storage] Objeto excede o limite permitido.");
    }
    return body;
  }

  async signedUrl(key: string): Promise<string> {
    // Sem assinatura real no modo local; apenas uma URL de dev.
    return `/media/${key}`;
  }

  async remove(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}
