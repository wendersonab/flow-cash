"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { categoriaSchema } from "@/lib/schemas"
import * as service from "@/services/categoriasService"

export interface ActionResult {
  ok: boolean
  error?: string
}

function parse(formData: FormData) {
  return categoriaSchema.safeParse({
    nome_categoria: formData.get("nome_categoria"),
    tipo_categoria: formData.get("tipo_categoria"),
  })
}

export async function criarCategoriaAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  try {
    await service.criarCategoria(user.id_usuario, parsed.data)
    revalidatePath("/categorias")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar." }
  }
}

export async function editarCategoriaAction(
  id_categoria: number,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }
  try {
    await service.editarCategoria(user.id_usuario, id_categoria, parsed.data)
    revalidatePath("/categorias")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar." }
  }
}

export async function excluirCategoriaAction(id_categoria: number): Promise<ActionResult> {
  const user = await requireUser()
  try {
    await service.excluirCategoria(user.id_usuario, id_categoria)
    revalidatePath("/categorias")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao excluir." }
  }
}
