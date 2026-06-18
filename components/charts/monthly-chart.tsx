"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PontoGraficoMensal } from "@/services/transacoesService"
import { formatCurrencyBRL } from "@/lib/format"
import { usePrivacy } from "@/components/providers/privacy-provider"
import { EmptyState } from "@/components/empty-state"
import { TrendingUp } from "lucide-react"

function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export function MonthlyChart({ data }: { data: PontoGraficoMensal[] }) {
  const { hideValues } = usePrivacy()
  const hasData = data.some((d) => d.receitas > 0 || d.despesas > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Sem dados suficientes"
        description="Adicione movimentações para visualizar a evolução mensal."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gReceitas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gDespesas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          stroke="var(--color-muted-foreground)"
          fontSize={12}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          stroke="var(--color-muted-foreground)"
          fontSize={12}
          width={56}
          tickFormatter={compact}
        />
        <Tooltip
          formatter={(value, name) => [hideValues ? "••••••" : formatCurrencyBRL(Number(value)), name === "receitas" ? "Receitas" : "Despesas"]}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            color: "var(--color-popover-foreground)",
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="receitas"
          stroke="var(--color-success)"
          strokeWidth={2}
          fill="url(#gReceitas)"
        />
        <Area
          type="monotone"
          dataKey="despesas"
          stroke="var(--color-destructive)"
          strokeWidth={2}
          fill="url(#gDespesas)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
