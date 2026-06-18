import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Categoria, TipoCategoria } from "@/lib/types"

export interface CategoriaComContagem extends Categoria {
  total_transacoes: number
}

const CATEGORIAS_DESPESA = [
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Moradia",
  "Educação",
  "Outros",
]
const CATEGORIAS_RECEITA = ["Salário", "Freelance", "Investimentos", "Outros"]

/** Cria as categorias iniciais (Receita e Despesa) para um novo usuário. */
export async function criarCategoriasIniciais(id_usuario: number): Promise<void> {
  const supabase = await createClient()

  const rows = [
    ...CATEGORIAS_RECEITA.map((nome) => ({
      nome_categoria: nome,
      tipo_categoria: "Receita",
      id_usuario,
    })),
    ...CATEGORIAS_DESPESA.map((nome) => ({
      nome_categoria: nome,
      tipo_categoria: "Despesa",
      id_usuario,
    })),
  ]

  const { error } = await supabase.from("categoria").insert(rows)
  if (error) throw new Error("Não foi possível criar as categorias iniciais.")
}

/** Lista as categorias do usuário com a contagem de transações vinculadas. */
export async function listarCategoriasDoUsuario(
  id_usuario: number,
): Promise<CategoriaComContagem[]> {
  const supabase = await createClient()

  const { data: categorias, error } = await supabase
    .from("categoria")
    .select("id_categoria, nome_categoria, tipo_categoria, id_usuario")
    .eq("id_usuario", id_usuario)
    .order("tipo_categoria", { ascending: true })
    .order("nome_categoria", { ascending: true })

  if (error) throw new Error("Erro ao carregar categorias.")

  // Contagem de transações por categoria (do próprio usuário)
  const { data: transacoes } = await supabase
    .from("transacao")
    .select("id_categoria")
    .eq("id_usuario", id_usuario)

  const contagem = new Map<number, number>()
  for (const t of transacoes ?? []) {
    if (t.id_categoria != null) {
      contagem.set(t.id_categoria, (contagem.get(t.id_categoria) ?? 0) + 1)
    }
  }

  return (categorias ?? []).map((c) => ({
    ...c,
    total_transacoes: contagem.get(c.id_categoria) ?? 0,
  }))
}

export async function criarCategoria(
  id_usuario: number,
  dados: { nome_categoria: string; tipo_categoria: TipoCategoria },
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("categoria").insert({
    nome_categoria: dados.nome_categoria,
    tipo_categoria: dados.tipo_categoria,
    id_usuario,
  })
  if (error) throw new Error("Erro ao criar categoria.")
}

export async function editarCategoria(
  id_usuario: number,
  id_categoria: number,
  dados: { nome_categoria: string; tipo_categoria: TipoCategoria },
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("categoria")
    .update({
      nome_categoria: dados.nome_categoria,
      tipo_categoria: dados.tipo_categoria,
    })
    .eq("id_categoria", id_categoria)
    .eq("id_usuario", id_usuario) // garante que pertence ao usuário logado
  if (error) throw new Error("Erro ao editar categoria.")
}

export async function excluirCategoria(
  id_usuario: number,
  id_categoria: number,
): Promise<void> {
  const supabase = await createClient()
  // ON DELETE SET NULL no banco: transações ficam com id_categoria = null
  const { error } = await supabase
    .from("categoria")
    .delete()
    .eq("id_categoria", id_categoria)
    .eq("id_usuario", id_usuario)
  if (error) throw new Error("Erro ao excluir categoria.")
}
