"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { GastoPorCategoria } from "@/services/transacoesService"
import { formatCurrencyBRL } from "@/lib/format"
import { usePrivacy } from "@/components/providers/privacy-provider"
import { EmptyState } from "@/components/empty-state"
import { PieChart as PieIcon } from "lucide-react"

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

export function CategoryPieChart({ data }: { data: GastoPorCategoria[] }) {
  const { hideValues } = usePrivacy()
  if (!data.length) {
    return (
      <EmptyState
        icon={PieIcon}
        title="Sem gastos no período"
        description="As despesas por categoria aparecerão aqui."
      />
    )
  }

  const total = data.reduce((acc, d) => acc + d.total, 0)

  return (
    <div className="flex min-w-0 flex-col items-center gap-4 lg:flex-row">
      <div className="h-[clamp(170px,45vw,240px)] w-full max-w-[240px] min-w-0 shrink overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={data}
              dataKey="total"
              nameKey="categoria"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={2}
            >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
            </Pie>
            <Tooltip
              formatter={(value) => hideValues ? "••••••" : formatCurrencyBRL(Number(value))}
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                color: "var(--color-popover-foreground)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.slice(0, 6).map((d, i) => (
          <li key={d.categoria} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-foreground">{d.categoria}</span>
            </span>
            <span className="shrink-0 font-medium text-muted-foreground">
              {total > 0 ? Math.round((d.total / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
