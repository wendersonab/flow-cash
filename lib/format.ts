import type { MetaFinanceira } from "./types"

/** Formata número como moeda BRL: R$ 1.500,00 */
export function formatCurrencyBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(valor) ? valor : 0)
}

/** Formata uma data (string YYYY-MM-DD ou Date) em pt-BR: 31/12/2025 */
export function formatDateBR(data: string | Date | null | undefined): string {
  if (!data) return "-"
  // Datas vindas do Postgres ("YYYY-MM-DD") devem ser tratadas como locais,
  // evitando deslocamento de fuso horário.
  let d: Date
  if (typeof data === "string") {
    const parts = data.slice(0, 10).split("-")
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    } else {
      d = new Date(data)
    }
  } else {
    d = data
  }
  if (Number.isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("pt-BR").format(d)
}

export type TransactionType = "Entrada" | "Saída"

/** Regra: valor >= 0 => Entrada (Receita); valor < 0 => Saída (Despesa) */
export function getTransactionType(valor: number): TransactionType {
  return valor >= 0 ? "Entrada" : "Saída"
}

/** Retorna metadados de badge para uma transação a partir do valor */
export function getTransactionBadge(valor: number): {
  label: TransactionType
  variant: "entrada" | "saida"
} {
  return valor >= 0
    ? { label: "Entrada", variant: "entrada" }
    : { label: "Saída", variant: "saida" }
}

/**
 * Normaliza entrada de dinheiro digitada pelo usuário (aceita "1.500,00",
 * "1500.00", "R$ 1.234,56") retornando um número positivo.
 */
export function normalizeMoneyInput(valor: string | number): number {
  if (typeof valor === "number") return Math.abs(valor)
  if (!valor) return 0

  let s = valor.toString().trim().replace(/[R$\s]/g, "")

  const hasComma = s.includes(",")
  const hasDot = s.includes(".")

  if (hasComma && hasDot) {
    // Formato pt-BR: ponto = milhar, vírgula = decimal
    s = s.replace(/\./g, "").replace(",", ".")
  } else if (hasComma) {
    // Apenas vírgula como decimal
    s = s.replace(",", ".")
  }
  // Apenas ponto: assume ponto decimal

  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? Math.abs(n) : 0
}

/** Progresso percentual de uma meta (0–100) */
export function calculateGoalProgress(valorAtual: number, valorObjetivo: number): number {
  if (!valorObjetivo || valorObjetivo <= 0) return 0
  const pct = (valorAtual / valorObjetivo) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export type GoalStatus = "Concluída" | "Atrasada" | "Em andamento"

/** Status automático de uma meta */
export function calculateGoalStatus(meta: Pick<MetaFinanceira, "valor_atual" | "valor_objetivo" | "data_limite">): GoalStatus {
  if (meta.valor_atual >= meta.valor_objetivo) return "Concluída"

  if (meta.data_limite) {
    const limite = new Date(meta.data_limite.slice(0, 10))
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    if (limite < hoje) return "Atrasada"
  }
  return "Em andamento"
}

/** Dias restantes até a data limite (negativo se vencida, null se sem prazo) */
export function daysUntil(dataLimite: string | null): number | null {
  if (!dataLimite) return null
  const limite = new Date(dataLimite.slice(0, 10))
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diff = limite.getTime() - hoje.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** Nome curto do mês a partir de "YYYY-MM" ou índice */
export function monthLabel(year: number, monthIndex0: number): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(year, monthIndex0, 1))
    .replace(".", "")
}

/** Iniciais a partir do nome (até 2 letras) */
export function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
