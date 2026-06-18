"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { metaSchema, aporteSchema } from "@/lib/schemas"
import * as service from "@/services/metasService"

export interface ActionResult {
  ok: boolean
  error?: string
}

function parse(formData: FormData) {
  return metaSchema.safeParse({
    nome_meta: formData.get("nome_meta"),
    valor_objetivo: formData.get("valor_objetivo"),
    data_limite: formData.get("data_limite") ?? "",
  })
}

export async function criarMetaAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  try {
    await service.criarMeta(user.id_usuario, {
      nome_meta: parsed.data.nome_meta,
      valor_objetivo: parsed.data.valor_objetivo,
      data_limite: parsed.data.data_limite || null,
    })
    revalidatePath("/metas")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar." }
  }
}

export async function editarMetaAction(
  id_meta: number,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  try {
    await service.editarMeta(user.id_usuario, id_meta, {
      nome_meta: parsed.data.nome_meta,
      valor_objetivo: parsed.data.valor_objetivo,
      data_limite: parsed.data.data_limite || null,
    })
    revalidatePath("/metas")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar." }
  }
}

export async function adicionarAporteAction(
  id_meta: number,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = aporteSchema.safeParse({ valor: formData.get("valor") })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  try {
    await service.adicionarAporte(user.id_usuario, id_meta, parsed.data.valor)
    revalidatePath("/metas")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao adicionar aporte." }
  }
}

export async function excluirMetaAction(id_meta: number): Promise<ActionResult> {
  const user = await requireUser()
  try {
    await service.excluirMeta(user.id_usuario, id_meta)
    revalidatePath("/metas")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao excluir." }
  }
}
