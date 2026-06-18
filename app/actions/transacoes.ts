"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { transacaoSchema } from "@/lib/schemas"
import * as service from "@/services/transacoesService"

export interface ActionResult {
  ok: boolean
  error?: string
}

function parseForm(formData: FormData) {
  return transacaoSchema.safeParse({
    valor: formData.get("valor"),
    tipo: formData.get("tipo"),
    data_transacao: formData.get("data_transacao"),
    descricao: formData.get("descricao") ?? "",
    id_categoria: formData.get("id_categoria") ?? "none",
  })
}

function toCategoriaId(value?: string): number | null {
  if (!value || value === "none") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function criarTransacaoAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  try {
    await service.criarTransacao(user.id_usuario, {
      valor: parsed.data.valor,
      tipo: parsed.data.tipo,
      data_transacao: parsed.data.data_transacao,
      descricao: parsed.data.descricao || null,
      id_categoria: toCategoriaId(parsed.data.id_categoria),
    })
    revalidatePath("/movimentacoes")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar." }
  }
}

export async function editarTransacaoAction(
  id_transacao: number,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  try {
    await service.editarTransacao(user.id_usuario, id_transacao, {
      valor: parsed.data.valor,
      tipo: parsed.data.tipo,
      data_transacao: parsed.data.data_transacao,
      descricao: parsed.data.descricao || null,
      id_categoria: toCategoriaId(parsed.data.id_categoria),
    })
    revalidatePath("/movimentacoes")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar." }
  }
}

export async function excluirTransacaoAction(id_transacao: number): Promise<ActionResult> {
  const user = await requireUser()
  try {
    await service.excluirTransacao(user.id_usuario, id_transacao)
    revalidatePath("/movimentacoes")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao excluir." }
  }
}
