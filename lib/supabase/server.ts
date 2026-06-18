import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/** Indica se as credenciais públicas do Supabase estão configuradas. */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Cliente Supabase para uso no SERVIDOR (Server Components, Server Actions,
 * Route Handlers). Usa apenas a chave anon pública e a sessão do usuário
 * persistida em cookies — toda a autenticação vem do Supabase Auth.
 *
 * Importante (Fluid compute): nunca guarde este cliente em variável global.
 * Crie um novo a cada chamada.
 */
export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Chamado de um Server Component — pode ser ignorado quando o
            // proxy/middleware é responsável por renovar a sessão.
          }
        },
      },
    },
  )
}
