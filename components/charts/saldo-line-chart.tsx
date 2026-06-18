"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PontoSaldo } from "@/services/relatoriosService"
import { formatCurrencyBRL } from "@/lib/format"
import { usePrivacy } from "@/components/providers/privacy-provider"
import { EmptyState } from "@/components/empty-state"
import { LineChart as LineIcon } from "lucide-react"

function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export function SaldoLineChart({ data }: { data: PontoSaldo[] }) {
  const { hideValues } = usePrivacy()
  if (!data.length) {
    return (
      <EmptyState
        icon={LineIcon}
        title="Sem dados no período"
        description="A evolução do saldo aparecerá aqui."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" fontSize={12} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" fontSize={12} width={56} tickFormatter={compact} />
        <Tooltip
          formatter={(value) => [hideValues ? "••••••" : formatCurrencyBRL(Number(value)), "Saldo acumulado"]}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            color: "var(--color-popover-foreground)",
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="saldo"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-primary)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
