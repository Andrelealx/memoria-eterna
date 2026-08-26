// Camada de armazenamento de mídia (seção 6). Isole o acesso em um adapter para
// permitir migração futura (Supabase Storage -> Cloudflare R2) sem alterar a
// lógica de negócio.

export interface UploadedMedia {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SignedUrlOptions {
  expiresInSeconds?: number;
}

export interface MediaStorageAdapter {
  readonly name: string;
  /** Faz upload de um arquivo já validado e devolve a chave privada. */
  upload(key: string, body: Uint8Array, contentType: string): Promise<UploadedMedia>;
  /** Gera URL assinada de curta duração (acesso privado). */
  signedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  /** Remove um arquivo. */
  remove(key: string): Promise<void>;
}

export type { MediaStorageAdapter as MediaStorage };
