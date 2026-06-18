import "server-only"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { criarCategoriasIniciais } from "./categoriasService"
import type { SessionUser } from "@/lib/types"

export interface AuthResult {
  ok: boolean
  error?: string
  debug?: string
  needsConfirmation?: boolean
  user?: SessionUser
}

export interface ProfileResult {
  success: boolean
  profile?: SessionUser
  message?: string
  debug?: string
}

const NAO_CONFIGURADO =
  "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."

// Mínimo necessário do usuário do Supabase Auth para resolver o perfil.
interface AuthUserLike {
  id?: string | null
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

/** Deriva o nome de exibição: user_metadata.nome -> user_metadata.name -> prefixo do e-mail. */
function derivarNome(authUser: AuthUserLike, email: string): string {
  const meta = authUser.user_metadata ?? {}
  const nome = (meta.nome as string | undefined) ?? (meta.name as string | undefined)
  const limpo = (nome ?? "").trim()
  return limpo || email.split("@")[0]
}

/**
 * Função ÚNICA que liga o Supabase Auth à tabela pública `usuario`.
 * A ligação é feita por `email` (a tabela usa id_usuario INT, nunca UUID).
 *
 * - Valida que há e-mail no usuário autenticado.
 * - Busca o perfil por e-mail.
 * - Cria o perfil se não existir (e então as categorias iniciais).
 * - Sempre retorna { success, profile } ou { success: false, message, debug }.
 */
export async function getOrCreateUserProfile(authUser: AuthUserLike): Promise<ProfileResult> {
  const email = authUser.email?.trim().toLowerCase()
  if (!email) {
    return {
      success: false,
      message: "Usuário autenticado não possui e-mail.",
      debug: "authUser.email está vazio/nulo.",
    }
  }

  const supabase = await createClient()

  const authId = authUser.id ?? null

  // 1. Buscar perfil existente por auth_user_id. Se o usuário for antigo,
  // caímos para o vínculo por e-mail e gravamos o auth_user_id em seguida.
  let perfilExistente: any = null
  let perfilError: any = null

  if (authId) {
    const result = await supabase
      .from("usuario")
      .select("id_usuario, nome, email, id_endereco, auth_user_id, avatar_url, avatar_path, tema_preferido, ocultar_valores")
      .eq("auth_user_id", authId)
      .maybeSingle()
    perfilExistente = result.data
    perfilError = result.error
  }

  if (!perfilExistente && !perfilError) {
    const result = await supabase
      .from("usuario")
      .select("id_usuario, nome, email, id_endereco, auth_user_id, avatar_url, avatar_path, tema_preferido, ocultar_valores")
      .eq("email", email)
      .maybeSingle()
    perfilExistente = result.data
    perfilError = result.error
  }

  console.log("[v0] getOrCreateUserProfile: buscando perfil por auth/email:", authId, email)

  if (perfilError) {
    console.error("[v0] Erro ao buscar perfil:", perfilError)
    return {
      success: false,
      message: "Erro ao buscar o perfil no banco de dados.",
      debug: perfilError.message,
    }
  }

  // 2. Perfil já existe: usar.
  if (perfilExistente) {
    console.log("[v0] getOrCreateUserProfile: perfil encontrado:", perfilExistente.id_usuario)

    const ajustes: Record<string, unknown> = {}
    if (authId && perfilExistente.auth_user_id !== authId) ajustes.auth_user_id = authId
    if (perfilExistente.email !== email) ajustes.email = email

    const perfilAtualizado = Object.keys(ajustes).length
      ? (await supabase
          .from("usuario")
          .update(ajustes)
          .eq("id_usuario", perfilExistente.id_usuario)
          .select("id_usuario, nome, email, avatar_url, avatar_path, tema_preferido, ocultar_valores")
          .single()).data ?? perfilExistente
      : perfilExistente

    return {
      success: true,
      profile: {
        id_usuario: perfilAtualizado.id_usuario,
        nome: perfilAtualizado.nome,
        email: perfilAtualizado.email,
        avatar_url: perfilAtualizado.avatar_url ?? null,
        avatar_path: perfilAtualizado.avatar_path ?? null,
        tema_preferido: perfilAtualizado.tema_preferido ?? "system",
        ocultar_valores: Boolean(perfilAtualizado.ocultar_valores),
      },
    }
  }

  // 3. Perfil não existe: criar com os campos exatos da tabela `usuario`.
  const nomeFallback = derivarNome(authUser, email)
  const payload = {
    nome: nomeFallback,
    email,
    senha_hash: "SUPABASE_AUTH",
    id_endereco: null,
    auth_user_id: authId,
    tema_preferido: "system",
    ocultar_valores: false,
  }

  const { data: novoPerfil, error: criarPerfilError } = await supabase
    .from("usuario")
    .insert(payload)
    .select("id_usuario, nome, email, id_endereco, avatar_url, avatar_path, tema_preferido, ocultar_valores")
    .single()

  if (criarPerfilError) {
    console.error("[v0] Erro ao criar perfil:", criarPerfilError)
    return {
      success: false,
      message: "Erro ao criar o perfil no banco de dados.",
      debug: criarPerfilError.message,
    }
  }

  console.log("[v0] getOrCreateUserProfile: perfil criado:", novoPerfil.id_usuario)

  const profile: SessionUser = {
    id_usuario: novoPerfil.id_usuario,
    nome: novoPerfil.nome,
    email: novoPerfil.email,
    avatar_url: novoPerfil.avatar_url ?? null,
    avatar_path: novoPerfil.avatar_path ?? null,
    tema_preferido: novoPerfil.tema_preferido ?? "system",
    ocultar_valores: Boolean(novoPerfil.ocultar_valores),
  }

  // 4. Criar categorias iniciais (não bloqueia o login se falhar).
  try {
    await criarCategoriasIniciais(novoPerfil.id_usuario)
    console.log("[v0] getOrCreateUserProfile: categorias iniciais criadas.")
  } catch (e) {
    const debug = e instanceof Error ? e.message : String(e)
    console.error("[v0] Erro ao criar categorias iniciais:", e)
    return {
      success: true,
      profile,
      message: "Perfil criado, mas as categorias iniciais falharam. Você pode criá-las manualmente.",
      debug,
    }
  }

  return { success: true, profile }
}

/** Cadastro via Supabase Auth + criação do perfil complementar em `usuario`. */
export async function register(
  nome: string,
  email: string,
  senha: string,
  emailRedirectTo: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: NAO_CONFIGURADO }
  try {
    const supabase = await createClient()
    const emailNorm = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signUp({
      email: emailNorm,
      password: senha,
      options: {
        emailRedirectTo,
        data: { nome: nome.trim() },
      },
    })

    if (error) {
      console.error("[v0] register: erro no signUp:", error)
      const msg = /already registered/i.test(error.message)
        ? "Este e-mail já está cadastrado."
        : "Não foi possível criar a conta. Tente novamente."
      return { ok: false, error: msg, debug: error.message }
    }

    // Se já há sessão (confirmação de e-mail desativada), cria o perfil agora.
    if (data.session && data.user) {
      const result = await getOrCreateUserProfile(data.user)
      if (!result.success || !result.profile) {
        return { ok: false, error: result.message ?? "Erro ao montar o perfil.", debug: result.debug }
      }
      return { ok: true, user: result.profile, debug: result.debug }
    }

    // Sem sessão: usuário precisa confirmar o e-mail antes de entrar.
    return { ok: true, needsConfirmation: true }
  } catch (e) {
    const debug = e instanceof Error ? e.message : String(e)
    console.error("[v0] register: erro inesperado:", e)
    return { ok: false, error: "Erro inesperado ao cadastrar.", debug }
  }
}

/** Login via Supabase Auth. Garante o perfil em `usuario` (mapeado por e-mail). */
export async function login(email: string, senha: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: NAO_CONFIGURADO }
  try {
    const supabase = await createClient()
    const emailNorm = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password: senha,
    })

    if (error || !data.user) {
      console.error("[v0] login: erro de autenticação:", error)
      if (/email not confirmed/i.test(error?.message ?? "")) {
        return { ok: false, error: "Confirme seu e-mail antes de entrar.", debug: error?.message }
      }
      return { ok: false, error: "E-mail ou senha inválidos.", debug: error?.message }
    }

    // Usa o usuário AUTENTICADO (data.user) para localizar/criar o perfil por e-mail.
    console.log("[v0] login: email autenticado:", data.user.email)
    const result = await getOrCreateUserProfile(data.user)

    if (!result.success || !result.profile) {
      return {
        ok: false,
        error: result.message ?? "Não foi possível carregar ou criar seu perfil.",
        debug: result.debug,
      }
    }

    return { ok: true, user: result.profile, debug: result.debug }
  } catch (e) {
    const debug = e instanceof Error ? e.message : String(e)
    console.error("[v0] login: erro inesperado:", e)
    return { ok: false, error: "Erro inesperado ao entrar.", debug }
  }
}

/** Envia o e-mail oficial do Supabase para recuperação de senha. */
export async function sendPasswordResetEmail(
  email: string,
  redirectTo: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: NAO_CONFIGURADO }
  try {
    const supabase = await createClient()
    const emailNorm = email.trim().toLowerCase()

    const { error } = await supabase.auth.resetPasswordForEmail(emailNorm, {
      redirectTo,
    })

    if (error) {
      console.error("[v0] sendPasswordResetEmail: erro:", error)
      return {
        ok: false,
        error: "Não foi possível enviar o e-mail de recuperação. Tente novamente.",
        debug: error.message,
      }
    }

    return { ok: true }
  } catch (e) {
    const debug = e instanceof Error ? e.message : String(e)
    console.error("[v0] sendPasswordResetEmail: erro inesperado:", e)
    return { ok: false, error: "Erro inesperado ao enviar o e-mail de recuperação.", debug }
  }
}

/** Atualiza a senha usando a sessão criada pelo link de recuperação do Supabase. */
export async function updatePassword(senha: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: NAO_CONFIGURADO }
  try {
    const supabase = await createClient()

    const { data: sessionData, error: sessionError } = await supabase.auth.getUser()
    if (sessionError || !sessionData.user) {
      return {
        ok: false,
        error: "Link de recuperação inválido ou expirado. Solicite um novo link.",
        debug: sessionError?.message,
      }
    }

    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      console.error("[v0] updatePassword: erro:", error)
      return {
        ok: false,
        error: "Não foi possível redefinir a senha. Solicite um novo link e tente novamente.",
        debug: error.message,
      }
    }

    await supabase.auth.signOut()
    return { ok: true }
  } catch (e) {
    const debug = e instanceof Error ? e.message : String(e)
    console.error("[v0] updatePassword: erro inesperado:", e)
    return { ok: false, error: "Erro inesperado ao redefinir a senha.", debug }
  }
}

/** Logout via Supabase Auth. */
export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
