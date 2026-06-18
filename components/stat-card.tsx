import type { LucideIcon } from "lucide-react"
import type * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MoneyValue } from "@/components/money-value"

interface StatCardProps {
  title: string
  icon: LucideIcon
  /** Quando informado, renderiza valor monetário com tom. */
  value?: number
  tone?: "auto" | "positive" | "negative" | "neutral"
  absolute?: boolean
  /** Conteúdo simples (ex: contagem) caso não seja moeda. */
  rawValue?: string | number
  hint?: React.ReactNode
  iconClassName?: string
}

export function StatCard({
  title,
  icon: Icon,
  value,
  tone = "auto",
  absolute,
  rawValue,
  hint,
  iconClassName,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {rawValue !== undefined ? (
            <p className="font-mono text-2xl font-semibold tabular-nums">{rawValue}</p>
          ) : (
            <MoneyValue
              value={value ?? 0}
              tone={tone}
              absolute={absolute}
              className="text-2xl font-semibold"
            />
          )}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground",
            iconClassName,
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}
