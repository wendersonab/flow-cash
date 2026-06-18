"use client"

import { cn } from "@/lib/utils"
import { formatCurrencyBRL } from "@/lib/format"
import { usePrivacy } from "@/components/providers/privacy-provider"

interface MoneyValueProps {
  value: number
  /**
   * - "auto": verde se >= 0, vermelho se < 0 (saldo)
   * - "positive": sempre verde (receitas)
   * - "negative": sempre vermelho (despesas)
   * - "neutral": cor padrão
   */
  tone?: "auto" | "positive" | "negative" | "neutral"
  className?: string
  /** Para despesas exibidas como valor absoluto */
  absolute?: boolean
}

export function MoneyValue({ value, tone = "auto", className, absolute }: MoneyValueProps) {
  const { hideValues } = usePrivacy()
  const display = absolute ? Math.abs(value) : value

  let colorClass = "text-foreground"
  if (tone === "positive") colorClass = "text-[var(--color-success)]"
  else if (tone === "negative") colorClass = "text-destructive"
  else if (tone === "auto") {
    colorClass = value >= 0 ? "text-[var(--color-success)]" : "text-destructive"
  }

  return (
    <span className={cn("font-mono tabular-nums", colorClass, className)}>
      {hideValues ? "••••••" : formatCurrencyBRL(display)}
    </span>
  )
}
