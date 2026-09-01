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

export interface SignedUpload {
  /** URL temporária que recebe os bytes diretamente, sem expor credenciais do servidor. */
  uploadUrl: string;
  storageKey: string;
  /** O Supabase usa multipart; Vercel Blob recebe o arquivo bruto por PUT. */
  bodyMode: "raw" | "multipart";
}

export interface DownloadOptions {
  /** Interrompe a leitura assim que o objeto excede o teto permitido. */
  maxBytes: number;
}

export interface MediaStorageAdapter {
  readonly name: string;
  /** Faz upload de um arquivo já validado e devolve a chave privada. */
  upload(key: string, body: Uint8Array, contentType: string): Promise<UploadedMedia>;
  /** Baixa um objeto privado com limite rígido de bytes. */
  download(key: string, options: DownloadOptions): Promise<Uint8Array>;
  /** Gera URL assinada de curta duração (acesso privado). */
  signedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  /**
   * Cria uma URL de upload direto quando o provedor oferece essa capacidade.
   * Adaptadores locais omitem o método e continuam usando o upload pelo servidor.
   */
  createSignedUploadUrl?(key: string): Promise<SignedUpload>;
  /** Garante que o bucket privado necessário ao upload direto exista. */
  ensureUploadBucket?(): Promise<void>;
  /** Remove um arquivo. */
  remove(key: string): Promise<void>;
}

export type { MediaStorageAdapter as MediaStorage };
