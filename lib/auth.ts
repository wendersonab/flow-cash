import "server-only"
import { redirect } from "next/navigation"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { getOrCreateUserProfile } from "@/services/authService"
import type { SessionUser } from "./types"

/**
 * Obtém o usuário autenticado pelo Supabase Auth e resolve o seu perfil
 * complementar na tabela `usuario` (que guarda o id_usuario inteiro usado
 * por todas as demais tabelas: categoria, transacao, meta_financeira).
 *
 * Se o usuário autenticado ainda não tiver perfil em `usuario` — situação comum
 * logo após confirmar o e-mail — o perfil é criado automaticamente.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // Sem credenciais do Supabase a aplicação ainda carrega; o usuário é tratado
  // como não autenticado até que as variáveis de ambiente sejam definidas.
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return null

  const { data: perfil } = await supabase
    .from("usuario")
    .select("id_usuario, nome, email, auth_user_id, avatar_url, avatar_path, tema_preferido, ocultar_valores")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
    .maybeSingle()

  if (perfil) {
    const ajustes: Record<string, unknown> = {}
    if (perfil.auth_user_id !== user.id) ajustes.auth_user_id = user.id
    if (perfil.email !== user.email.toLowerCase()) ajustes.email = user.email.toLowerCase()

    const perfilAtualizado = Object.keys(ajustes).length
      ? (await supabase
          .from("usuario")
          .update(ajustes)
          .eq("id_usuario", perfil.id_usuario)
          .select("id_usuario, nome, email, avatar_url, avatar_path, tema_preferido, ocultar_valores")
          .single()).data ?? perfil
      : perfil

    return {
      id_usuario: perfilAtualizado.id_usuario,
      nome: perfilAtualizado.nome,
      email: perfilAtualizado.email,
      avatar_url: perfilAtualizado.avatar_url ?? null,
      avatar_path: perfilAtualizado.avatar_path ?? null,
      tema_preferido: perfilAtualizado.tema_preferido ?? "system",
      ocultar_valores: Boolean(perfilAtualizado.ocultar_valores),
    }
  }

  const result = await getOrCreateUserProfile(user)
  if (!result.success || !result.profile) return null

  return result.profile
}

/**
 * Exige autenticação. Redireciona para /login se não houver sessão.
 * NUNCA confie em id vindo do client — use o id_usuario retornado aqui.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}
