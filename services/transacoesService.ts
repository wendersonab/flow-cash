import "server-only"
import { createClient } from "@/lib/supabase/server"
import { monthLabel } from "@/lib/format"
import type { TransacaoComCategoria } from "@/lib/types"

const SELECT_COM_CATEGORIA =
  "id_transacao, valor, data_transacao, descricao, id_usuario, id_categoria, categoria:id_categoria(id_categoria, nome_categoria, tipo_categoria)"

export interface TransacaoFiltros {
  tipo?: "Todos" | "Entrada" | "Saída"
  id_categoria?: number | null
  dataInicio?: string | null
  dataFim?: string | null
  busca?: string | null
  page?: number
  pageSize?: number
}

export interface ListaTransacoes {
  itens: TransacaoComCategoria[]
  total: number
  page: number
  pageSize: number
}

function normalizeRow(row: any): TransacaoComCategoria {
  return {
    ...row,
    valor: Number(row.valor),
    categoria: Array.isArray(row.categoria) ? (row.categoria[0] ?? null) : (row.categoria ?? null),
  }
}

/** Lista transações do usuário logado, com filtros e paginação. */
export async function listarTransacoes(
  id_usuario: number,
  filtros: TransacaoFiltros = {},
): Promise<ListaTransacoes> {
  const supabase = await createClient()
  const page = Math.max(1, filtros.page ?? 1)
  const pageSize = filtros.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("transacao")
    .select(SELECT_COM_CATEGORIA, { count: "exact" })
    .eq("id_usuario", id_usuario)

  if (filtros.tipo === "Entrada") query = query.gte("valor", 0)
  if (filtros.tipo === "Saída") query = query.lt("valor", 0)
  if (filtros.id_categoria != null) query = query.eq("id_categoria", filtros.id_categoria)
  if (filtros.dataInicio) query = query.gte("data_transacao", filtros.dataInicio)
  if (filtros.dataFim) query = query.lte("data_transacao", filtros.dataFim)
  if (filtros.busca) query = query.ilike("descricao", `%${filtros.busca}%`)

  query = query
    .order("data_transacao", { ascending: false })
    .order("id_transacao", { ascending: false })
    .range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error("Erro ao carregar movimentações.")

  return {
    itens: (data ?? []).map(normalizeRow),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export interface TransacaoDados {
  valor: number // sempre positivo
  tipo: "Entrada" | "Saída"
  data_transacao: string
  descricao?: string | null
  id_categoria?: number | null
}

function valorComSinal(valor: number, tipo: "Entrada" | "Saída"): number {
  const abs = Math.abs(valor)
  return tipo === "Entrada" ? abs : -abs
}

export async function criarTransacao(id_usuario: number, dados: TransacaoDados): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("transacao").insert({
    valor: valorComSinal(dados.valor, dados.tipo),
    data_transacao: dados.data_transacao,
    descricao: dados.descricao?.trim() || null,
    id_categoria: dados.id_categoria ?? null,
    id_usuario,
  })
  if (error) throw new Error("Erro ao criar movimentação.")
}

export async function editarTransacao(
  id_usuario: number,
  id_transacao: number,
  dados: TransacaoDados,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("transacao")
    .update({
      valor: valorComSinal(dados.valor, dados.tipo),
      data_transacao: dados.data_transacao,
      descricao: dados.descricao?.trim() || null,
      id_categoria: dados.id_categoria ?? null,
    })
    .eq("id_transacao", id_transacao)
    .eq("id_usuario", id_usuario)
  if (error) throw new Error("Erro ao editar movimentação.")
}

export async function excluirTransacao(
  id_usuario: number,
  id_transacao: number,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("transacao")
    .delete()
    .eq("id_transacao", id_transacao)
    .eq("id_usuario", id_usuario)
  if (error) throw new Error("Erro ao excluir movimentação.")
}

export interface ResumoMes {
  saldo: number
  receitas: number
  despesas: number
}

/** Resumo (receitas, despesas, saldo) do mês atual. */
export async function resumoMes(id_usuario: number): Promise<ResumoMes> {
  const supabase = await createClient()
  const now = new Date()
  const inicio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const fimDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fim = `${fimDate.getFullYear()}-${String(fimDate.getMonth() + 1).padStart(2, "0")}-${String(fimDate.getDate()).padStart(2, "0")}`

  const { data, error } = await supabase
    .from("transacao")
    .select("valor")
    .eq("id_usuario", id_usuario)
    .gte("data_transacao", inicio)
    .lte("data_transacao", fim)

  if (error) throw new Error("Erro ao calcular resumo do mês.")

  let receitas = 0
  let despesas = 0
  for (const t of data ?? []) {
    const v = Number(t.valor)
    if (v >= 0) receitas += v
    else despesas += Math.abs(v)
  }
  return { receitas, despesas, saldo: receitas - despesas }
}

/** Últimas N transações do usuário. */
export async function ultimasTransacoes(
  id_usuario: number,
  limite = 10,
): Promise<TransacaoComCategoria[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transacao")
    .select(SELECT_COM_CATEGORIA)
    .eq("id_usuario", id_usuario)
    .order("data_transacao", { ascending: false })
    .order("id_transacao", { ascending: false })
    .limit(limite)

  if (error) throw new Error("Erro ao carregar últimas transações.")
  return (data ?? []).map(normalizeRow)
}

export interface PontoGraficoMensal {
  mes: string
  receitas: number
  despesas: number
}

/** Receitas x Despesas dos últimos 6 meses. */
export async function dadosGraficoMensal(id_usuario: number): Promise<PontoGraficoMensal[]> {
  const supabase = await createClient()
  const now = new Date()
  const inicioDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const inicio = `${inicioDate.getFullYear()}-${String(inicioDate.getMonth() + 1).padStart(2, "0")}-01`

  const { data, error } = await supabase
    .from("transacao")
    .select("valor, data_transacao")
    .eq("id_usuario", id_usuario)
    .gte("data_transacao", inicio)

  if (error) throw new Error("Erro ao carregar gráfico mensal.")

  const buckets = new Map<string, PontoGraficoMensal>()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    buckets.set(key, { mes: monthLabel(d.getFullYear(), d.getMonth()), receitas: 0, despesas: 0 })
  }

  for (const t of data ?? []) {
    const key = String(t.data_transacao).slice(0, 7)
    const bucket = buckets.get(key)
    if (!bucket) continue
    const v = Number(t.valor)
    if (v >= 0) bucket.receitas += v
    else bucket.despesas += Math.abs(v)
  }

  return Array.from(buckets.values())
}

export interface GastoPorCategoria {
  categoria: string
  total: number
}

/** Distribuição de gastos (valores negativos) por categoria no mês atual. */
export async function gastosPorCategoria(id_usuario: number): Promise<GastoPorCategoria[]> {
  const supabase = await createClient()
  const now = new Date()
  const inicio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const fimDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fim = `${fimDate.getFullYear()}-${String(fimDate.getMonth() + 1).padStart(2, "0")}-${String(fimDate.getDate()).padStart(2, "0")}`

  const { data, error } = await supabase
    .from("transacao")
    .select("valor, categoria:id_categoria(nome_categoria)")
    .eq("id_usuario", id_usuario)
    .lt("valor", 0)
    .gte("data_transacao", inicio)
    .lte("data_transacao", fim)

  if (error) throw new Error("Erro ao carregar gastos por categoria.")

  const map = new Map<string, number>()
  for (const t of data ?? []) {
    const catRaw: any = (t as any).categoria
    const cat = Array.isArray(catRaw) ? catRaw[0] : catRaw
    const nome = cat?.nome_categoria ?? "Sem categoria"
    map.set(nome, (map.get(nome) ?? 0) + Math.abs(Number(t.valor)))
  }

  return Array.from(map.entries())
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
}
