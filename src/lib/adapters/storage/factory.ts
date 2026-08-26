import { getEnv } from "@/lib/env";
import type { MediaStorageAdapter } from "./index";
import { LocalStorageAdapter } from "./local";
import { SupabaseStorageAdapter } from "./supabase";

// Factory do storage (seção 6). Dev sem Supabase -> local; produção -> Supabase.
export function getStorageAdapter(): MediaStorageAdapter {
  const env = getEnv();

  if (env.NODE_ENV === "production") {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "[storage] Supabase é obrigatório em produção (NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
      );
    }
    return new SupabaseStorageAdapter(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  if (env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseStorageAdapter(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return new LocalStorageAdapter();
}
