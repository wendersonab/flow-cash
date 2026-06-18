"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/schemas"
import * as authService from "@/services/authService"

export interface AuthActionResult {
  success: boolean
  message?: string
  debug?: string
  needsConfirmation?: boolean
  user?: {
    id_usuario: number
    nome: string
    email: string
  }
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "")
}

function withProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

/**
 * Resolve a URL pública da aplicação.
 *
 * Em produção, prefira definir NEXT_PUBLIC_SITE_URL no Vercel com o domínio real
 * da aplicação, por exemplo: https://flowcash.vercel.app.
 */
async function getAppBaseUrl(): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) return normalizeUrl(withProtocol(siteUrl))

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (productionUrl) return normalizeUrl(withProtocol(productionUrl))

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return normalizeUrl(withProtocol(vercelUrl))

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https")
  return normalizeUrl(`${proto}://${host}`)
}

/** Monta a URL de callback do Supabase para confirmação de e-mail/cadastro. */
async function getEmailRedirectTo(): Promise<string> {
  return `${await getAppBaseUrl()}/auth/callback`
}

/** Monta a URL de callback específica para recuperação de senha. */
async function getPasswordResetRedirectTo(): Promise<string> {
  const callbackUrl = new URL(await getEmailRedirectTo())
  callbackUrl.searchParams.set("next", "/reset-password")
  return callbackUrl.toString()
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      senha: formData.get("senha"),
    })
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." }
    }

    const result = await authService.login(parsed.data.email, parsed.data.senha)
    if (!result.ok || !result.user) {
      return { success: false, message: result.error ?? "Não foi possível entrar.", debug: result.debug }
    }

    return { success: true, user: result.user }
  } catch {
    return { success: false, message: "Erro inesperado ao entrar. Tente novamente." }
  }
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  try {
    const parsed = registerSchema.safeParse({
      nome: formData.get("nome"),
      email: formData.get("email"),
      senha: formData.get("senha"),
      confirmarSenha: formData.get("confirmarSenha"),
    })
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." }
    }

    const result = await authService.register(
      parsed.data.nome,
      parsed.data.email,
      parsed.data.senha,
      await getEmailRedirectTo(),
    )
    if (!result.ok) {
      return { success: false, message: result.error ?? "Não foi possível criar a conta.", debug: result.debug }
    }
    if (result.needsConfirmation) {
      return { success: true, needsConfirmation: true }
    }

    return { success: true, user: result.user }
  } catch {
    return { success: false, message: "Erro inesperado ao cadastrar. Tente novamente." }
  }
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  try {
    const parsed = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    })
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." }
    }

    const result = await authService.sendPasswordResetEmail(
      parsed.data.email,
      await getPasswordResetRedirectTo(),
    )
    if (!result.ok) {
      return {
        success: false,
        message: result.error ?? "Não foi possível enviar o e-mail de recuperação.",
        debug: result.debug,
      }
    }

    return { success: true }
  } catch {
    return { success: false, message: "Erro inesperado ao solicitar recuperação de senha." }
  }
}

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  try {
    const parsed = resetPasswordSchema.safeParse({
      senha: formData.get("senha"),
      confirmarSenha: formData.get("confirmarSenha"),
    })
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." }
    }

    const result = await authService.updatePassword(parsed.data.senha)
    if (!result.ok) {
      return {
        success: false,
        message: result.error ?? "Não foi possível redefinir a senha.",
        debug: result.debug,
      }
    }

    return { success: true }
  } catch {
    return { success: false, message: "Erro inesperado ao redefinir a senha." }
  }
}

export async function logoutAction(): Promise<void> {
  await authService.logout()
  redirect("/login")
}
