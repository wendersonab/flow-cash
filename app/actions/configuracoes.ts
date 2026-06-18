"use server"

import { revalidatePath } from "next/cache"
import { alterarSenhaSchema, excluirContaSchema, perfilSchema, preferenciasUsuarioSchema } from "@/lib/schemas"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { requireUser } from "@/lib/auth"

export interface ConfigActionResult {
  ok: boolean
  message?: string
  debug?: string
  emailConfirmationSent?: boolean
}

const AVATAR_BUCKET = "avatars"
const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  return "jpg"
}

export async function atualizarPerfilAction(formData: FormData): Promise<ConfigActionResult> {
  const parsed = perfilSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const user = await requireUser()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser?.id || !authUser.email) {
    return { ok: false, message: "Sessão inválida. Entre novamente.", debug: authError?.message }
  }

  const nome = parsed.data.nome.trim()
  const novoEmail = parsed.data.email.trim().toLowerCase()
  const emailAtualAuth = authUser.email.trim().toLowerCase()
  let emailConfirmationSent = false

  if (novoEmail !== emailAtualAuth) {
    const { error: emailError } = await supabase.auth.updateUser({
      email: novoEmail,
      data: { nome },
    })

    if (emailError) {
      return {
        ok: false,
        message: "Não foi possível solicitar a alteração de e-mail.",
        debug: emailError.message,
      }
    }

    emailConfirmationSent = true
  } else {
    await supabase.auth.updateUser({ data: { nome } })
  }

  const { error } = await supabase
    .from("usuario")
    .update({ nome, email: novoEmail, auth_user_id: authUser.id })
    .eq("id_usuario", user.id_usuario)

  if (error) {
    return { ok: false, message: "Não foi possível atualizar o perfil.", debug: error.message }
  }

  revalidatePath("/", "layout")
  return {
    ok: true,
    emailConfirmationSent,
    message: emailConfirmationSent
      ? "Perfil salvo. Confirme o novo e-mail pelo link enviado."
      : "Perfil atualizado com sucesso.",
  }
}

export async function alterarSenhaAction(formData: FormData): Promise<ConfigActionResult> {
  const parsed = alterarSenhaSchema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmarNovaSenha: formData.get("confirmarNovaSenha"),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) {
    return { ok: false, message: "Sessão inválida. Entre novamente." }
  }

  const { error: senhaAtualError } = await supabase.auth.signInWithPassword({
    email: authUser.email,
    password: parsed.data.senhaAtual,
  })

  if (senhaAtualError) {
    return { ok: false, message: "Senha atual incorreta.", debug: senhaAtualError.message }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.novaSenha })
  if (error) {
    return { ok: false, message: "Não foi possível alterar a senha.", debug: error.message }
  }

  return { ok: true, message: "Senha alterada com sucesso." }
}

export async function atualizarAvatarAction(formData: FormData): Promise<ConfigActionResult> {
  const file = formData.get("avatar")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Escolha uma imagem para enviar." }
  }

  if (!AVATAR_TYPES.includes(file.type)) {
    return { ok: false, message: "Envie uma imagem PNG, JPG, WebP ou GIF." }
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { ok: false, message: "A imagem deve ter no máximo 2 MB." }
  }

  const supabase = await createClient()
  const user = await requireUser()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.id) {
    return { ok: false, message: "Sessão inválida. Entre novamente." }
  }

  const ext = fileExtension(file)
  const path = `${authUser.id}/avatar.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  if (user.avatar_path && user.avatar_path !== path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([user.avatar_path])
  }

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return {
      ok: false,
      message: "Não foi possível enviar a foto. Confira o bucket avatars no Supabase.",
      debug: uploadError.message,
    }
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`

  const { error } = await supabase
    .from("usuario")
    .update({ avatar_url: avatarUrl, avatar_path: path, auth_user_id: authUser.id })
    .eq("id_usuario", user.id_usuario)

  if (error) {
    return { ok: false, message: "Foto enviada, mas não foi possível salvar no perfil.", debug: error.message }
  }

  revalidatePath("/", "layout")
  return { ok: true, message: "Foto de perfil atualizada." }
}

export async function removerAvatarAction(): Promise<ConfigActionResult> {
  const supabase = await createClient()
  const user = await requireUser()

  if (user.avatar_path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([user.avatar_path])
  }

  const { error } = await supabase
    .from("usuario")
    .update({ avatar_url: null, avatar_path: null })
    .eq("id_usuario", user.id_usuario)

  if (error) return { ok: false, message: "Não foi possível remover a foto.", debug: error.message }

  revalidatePath("/", "layout")
  return { ok: true, message: "Foto removida." }
}

export async function atualizarPreferenciasAction(input: {
  tema_preferido: "system" | "light" | "dark"
  ocultar_valores: boolean
}): Promise<ConfigActionResult> {
  const parsed = preferenciasUsuarioSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Preferências inválidas." }
  }

  const supabase = await createClient()
  const user = await requireUser()
  const { error } = await supabase
    .from("usuario")
    .update(parsed.data)
    .eq("id_usuario", user.id_usuario)

  if (error) return { ok: false, message: "Não foi possível salvar as preferências.", debug: error.message }

  revalidatePath("/", "layout")
  return { ok: true, message: "Preferências salvas." }
}

export async function excluirContaAction(formData: FormData): Promise<ConfigActionResult> {
  const parsed = excluirContaSchema.safeParse({ confirmacao: formData.get("confirmacao") })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Confirmação inválida." }
  }

  if (!isSupabaseAdminConfigured) {
    return {
      ok: false,
      message: "Exclusão indisponível: configure SUPABASE_SERVICE_ROLE_KEY na Vercel.",
    }
  }

  const supabase = await createClient()
  const user = await requireUser()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.id) {
    return { ok: false, message: "Sessão inválida. Entre novamente." }
  }

  const admin = createAdminClient()

  if (user.avatar_path) {
    await admin.storage.from(AVATAR_BUCKET).remove([user.avatar_path])
  }

  const tables = ["transacao", "meta_financeira", "categoria"]
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("id_usuario", user.id_usuario)
    if (error) return { ok: false, message: "Não foi possível remover seus dados.", debug: `${table}: ${error.message}` }
  }

  const { error: perfilError } = await admin.from("usuario").delete().eq("id_usuario", user.id_usuario)
  if (perfilError) {
    return { ok: false, message: "Não foi possível remover seu perfil.", debug: perfilError.message }
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(authUser.id)
  if (authDeleteError) {
    return { ok: false, message: "Perfil removido, mas não foi possível remover o acesso Auth.", debug: authDeleteError.message }
  }

  await supabase.auth.signOut()
  return { ok: true, message: "Conta excluída com sucesso." }
}
