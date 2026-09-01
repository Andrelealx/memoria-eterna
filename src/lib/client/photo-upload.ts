/**
 * Envia uma foto diretamente para a capacidade temporária do Supabase.
 * Não recebe chave anônima nem service role: toda autorização está embutida na
 * URL curta criada no servidor.
 */
export async function uploadPhotoToSignedUrl(
  uploadUrl: string,
  file: File,
  bodyMode: "raw" | "multipart",
  fetcher: typeof fetch = fetch,
): Promise<void> {
  let url: URL;
  try {
    url = new URL(uploadUrl);
  } catch {
    throw new Error("[upload] Endereço temporário inválido.");
  }
  if (url.protocol !== "https:") {
    throw new Error("[upload] O envio direto exige uma conexão segura.");
  }

  // Supabase recebe Blob/File como multipart; o PUT presigned do Vercel Blob
  // recebe os bytes brutos. Em ambos os casos os bytes não passam pelo Next.js.
  const body =
    bodyMode === "multipart"
      ? (() => {
          const form = new FormData();
          form.append("cacheControl", "3600");
          form.append("", file);
          return form;
        })()
      : file;
  const response = await fetcher(url, {
    method: "PUT",
    headers:
      bodyMode === "multipart"
        ? { "x-upsert": "false" }
        : {
            // O endpoint de controle do Vercel Blob usa estes metadados para
            // validar o store privado e as restrições da URL assinada.
            "Content-Type": file.type || "application/octet-stream",
            "x-content-type": file.type || "application/octet-stream",
            "x-vercel-blob-access": "private",
          },
    body,
  });
  if (!response.ok) {
    throw new Error(`[upload] O envio direto falhou (${response.status}).`);
  }
}
