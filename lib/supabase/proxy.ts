import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Atualiza/renova a sessão do Supabase Auth e sincroniza os cookies na resposta.
 *
 * IMPORTANTE: este proxy NÃO faz redirect de rota. A proteção de rotas é feita
 * inteiramente no servidor, dentro do layout `app/(protected)/layout.tsx` e da
 * página `app/login/page.tsx`. Misturar redirect aqui com a proteção no layout
 * causava um loop infinito de `GET /dashboard 307`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sem credenciais do Supabase, apenas segue adiante.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // Apenas renova a sessão (atualiza tokens/cookies). Sem redirects.
  await supabase.auth.getUser()

  return supabaseResponse
}
