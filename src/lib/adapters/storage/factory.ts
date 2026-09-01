import { getEnv } from "@/lib/env";
import type { MediaStorageAdapter } from "./index";
import { LocalStorageAdapter } from "./local";
import { SupabaseStorageAdapter } from "./supabase";
import { VercelBlobStorageAdapter } from "./vercel-blob";

// Factory do storage (seção 6). Dev sem Supabase -> local; Vercel -> Blob privado.
export function getStorageAdapter(): MediaStorageAdapter {
  const env = getEnv();

  // Projetos Vercel conectados ao Blob privado recebem OIDC curto e o store id
  // automaticamente. O token OIDC também é gravado pelo `vercel link` no
  // ambiente local, mas só é utilizável dentro de uma Function da Vercel.
  // Tokens legados continuam suportados para desenvolvimento explícito.
  const hasVercelBlob =
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) ||
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL_ENV);
  if (hasVercelBlob) return new VercelBlobStorageAdapter();

  if (env.NODE_ENV === "production") {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "[storage] Configure Vercel Blob privado ou Supabase para mídia em produção.",
      );
    }
    return new SupabaseStorageAdapter(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  if (env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseStorageAdapter(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return new LocalStorageAdapter();
}
