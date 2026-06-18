import { createBrowserClient } from "@supabase/ssr"

/**
 * Cliente Supabase para uso no CLIENT (browser).
 * Usa apenas a chave anon pública. A sessão é gerenciada pelo Supabase Auth.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
