import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { MetaFinanceira } from "@/lib/types"

function normalize(row: any): MetaFinanceira {
  return {
    ...row,
    valor_objetivo: Number(row.valor_objetivo),
    valor_atual: Number(row.valor_atual ?? 0),
  }
}

export async function listarMetas(id_usuario: number): Promise<MetaFinanceira[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("meta_financeira")
    .select("id_meta, nome_meta, valor_objetivo, valor_atual, data_limite, id_usuario")
    .eq("id_usuario", id_usuario)
    .order("id_meta", { ascending: false })

  if (error) throw new Error("Erro ao carregar metas.")
  return (data ?? []).map(normalize)
}

/** Conta metas ativas (não concluídas) do usuário. */
export async function contarMetasAtivas(id_usuario: number): Promise<number> {
  const metas = await listarMetas(id_usuario)
  return metas.filter((m) => m.valor_atual < m.valor_objetivo).length
}

export interface MetaDados {
  nome_meta: string
  valor_objetivo: number
  data_limite?: string | null
}

export async function criarMeta(id_usuario: number, dados: MetaDados): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("meta_financeira").insert({
    nome_meta: dados.nome_meta,
    valor_objetivo: dados.valor_objetivo,
    valor_atual: 0,
    data_limite: dados.data_limite || null,
    id_usuario,
  })
  if (error) throw new Error("Erro ao criar meta.")
}

export async function editarMeta(
  id_usuario: number,
  id_meta: number,
  dados: MetaDados,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("meta_financeira")
    .update({
      nome_meta: dados.nome_meta,
      valor_objetivo: dados.valor_objetivo,
      data_limite: dados.data_limite || null,
    })
    .eq("id_meta", id_meta)
    .eq("id_usuario", id_usuario)
  if (error) throw new Error("Erro ao editar meta.")
}

/** Adiciona um aporte incrementando valor_atual. */
export async function adicionarAporte(
  id_usuario: number,
  id_meta: number,
  valor: number,
): Promise<void> {
  const supabase = await createClient()

  const { data: meta, error: selErr } = await supabase
    .from("meta_financeira")
    .select("valor_atual")
    .eq("id_meta", id_meta)
    .eq("id_usuario", id_usuario)
    .maybeSingle()

  if (selErr || !meta) throw new Error("Meta não encontrada.")

  const novoValor = Number(meta.valor_atual ?? 0) + Math.abs(valor)
  const { error } = await supabase
    .from("meta_financeira")
    .update({ valor_atual: novoValor })
    .eq("id_meta", id_meta)
    .eq("id_usuario", id_usuario)

  if (error) throw new Error("Erro ao adicionar aporte.")
}

export async function excluirMeta(id_usuario: number, id_meta: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("meta_financeira")
    .delete()
    .eq("id_meta", id_meta)
    .eq("id_usuario", id_usuario)
  if (error) throw new Error("Erro ao excluir meta.")
}
