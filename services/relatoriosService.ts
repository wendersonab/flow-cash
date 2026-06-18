import "server-only"
import { createClient } from "@/lib/supabase/server"
import { monthLabel } from "@/lib/format"

export interface PeriodoRange {
  inicio: string // YYYY-MM-DD
  fim: string // YYYY-MM-DD
}

interface RowMin {
  valor: number
  data_transacao: string
  categoria?: { nome_categoria: string } | { nome_categoria: string }[] | null
}

async function carregarTransacoesPeriodo(
  id_usuario: number,
  periodo: PeriodoRange,
): Promise<RowMin[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transacao")
    .select("valor, data_transacao, categoria:id_categoria(nome_categoria)")
    .eq("id_usuario", id_usuario)
    .gte("data_transacao", periodo.inicio)
    .lte("data_transacao", periodo.fim)
    .order("data_transacao", { ascending: true })

  if (error) throw new Error("Erro ao carregar dados do período.")
  return (data ?? []).map((r) => ({ ...r, valor: Number(r.valor) })) as RowMin[]
}

function nomeCategoria(row: RowMin): string {
  const c: any = row.categoria
  const cat = Array.isArray(c) ? c[0] : c
  return cat?.nome_categoria ?? "Sem categoria"
}

export interface ResumoPeriodo {
  receitas: number
  despesas: number
  saldo: number
  maiorCategoria: { categoria: string; total: number } | null
}

export async function resumoPorPeriodo(
  id_usuario: number,
  periodo: PeriodoRange,
): Promise<ResumoPeriodo> {
  const rows = await carregarTransacoesPeriodo(id_usuario, periodo)
  let receitas = 0
  let despesas = 0
  const gastos = new Map<string, number>()

  for (const r of rows) {
    if (r.valor >= 0) receitas += r.valor
    else {
      const abs = Math.abs(r.valor)
      despesas += abs
      const nome = nomeCategoria(r)
      gastos.set(nome, (gastos.get(nome) ?? 0) + abs)
    }
  }

  let maiorCategoria: ResumoPeriodo["maiorCategoria"] = null
  for (const [categoria, total] of gastos.entries()) {
    if (!maiorCategoria || total > maiorCategoria.total) {
      maiorCategoria = { categoria, total }
    }
  }

  return { receitas, despesas, saldo: receitas - despesas, maiorCategoria }
}

export interface PontoMes {
  mes: string
  receitas: number
  despesas: number
}

export async function receitasDespesasPorMes(
  id_usuario: number,
  periodo: PeriodoRange,
): Promise<PontoMes[]> {
  const rows = await carregarTransacoesPeriodo(id_usuario, periodo)

  const buckets = new Map<string, PontoMes>()
  const start = new Date(periodo.inicio.slice(0, 10))
  const end = new Date(periodo.fim.slice(0, 10))
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
    buckets.set(key, {
      mes: monthLabel(cursor.getFullYear(), cursor.getMonth()),
      receitas: 0,
      despesas: 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  for (const r of rows) {
    const key = r.data_transacao.slice(0, 7)
    const b = buckets.get(key)
    if (!b) continue
    if (r.valor >= 0) b.receitas += r.valor
    else b.despesas += Math.abs(r.valor)
  }

  return Array.from(buckets.values())
}

export interface PontoSaldo {
  mes: string
  saldo: number
}

export async function evolucaoSaldo(
  id_usuario: number,
  periodo: PeriodoRange,
): Promise<PontoSaldo[]> {
  const porMes = await receitasDespesasPorMes(id_usuario, periodo)
  let acumulado = 0
  return porMes.map((p) => {
    acumulado += p.receitas - p.despesas
    return { mes: p.mes, saldo: acumulado }
  })
}

export interface ResumoCategoria {
  categoria: string
  total: number
  percentual: number
}

/** Resumo por categoria (gastos) com percentual. */
export async function resumoPorCategoria(
  id_usuario: number,
  periodo: PeriodoRange,
): Promise<ResumoCategoria[]> {
  const rows = await carregarTransacoesPeriodo(id_usuario, periodo)

  const map = new Map<string, number>()
  let totalGastos = 0
  for (const r of rows) {
    if (r.valor < 0) {
      const abs = Math.abs(r.valor)
      totalGastos += abs
      const nome = nomeCategoria(r)
      map.set(nome, (map.get(nome) ?? 0) + abs)
    }
  }

  return Array.from(map.entries())
    .map(([categoria, total]) => ({
      categoria,
      total,
      percentual: totalGastos > 0 ? Math.round((total / totalGastos) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}
