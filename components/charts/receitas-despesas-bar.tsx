"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PontoMes } from "@/services/relatoriosService"
import { formatCurrencyBRL } from "@/lib/format"
import { usePrivacy } from "@/components/providers/privacy-provider"
import { EmptyState } from "@/components/empty-state"
import { BarChart3 } from "lucide-react"

function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export function ReceitasDespesasBar({ data }: { data: PontoMes[] }) {
  const { hideValues } = usePrivacy()
  const hasData = data.some((d) => d.receitas > 0 || d.despesas > 0)
  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sem dados no período"
        description="Selecione outro período ou registre movimentações."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" fontSize={12} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" fontSize={12} width={56} tickFormatter={compact} />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
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
        <Bar dataKey="receitas" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
