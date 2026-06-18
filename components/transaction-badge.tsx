import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function TransactionBadge({ valor }: { valor: number }) {
  const isEntrada = valor >= 0
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-transparent font-medium",
        isEntrada
          ? "bg-[var(--color-success)]/12 text-[var(--color-success)]"
          : "bg-destructive/12 text-destructive",
      )}
    >
      {isEntrada ? (
        <ArrowUpRight className="size-3.5" />
      ) : (
        <ArrowDownLeft className="size-3.5" />
      )}
      {isEntrada ? "Entrada" : "Saída"}
    </Badge>
  )
}

export function CategoryTypeBadge({ tipo }: { tipo: string | null }) {
  const isReceita = tipo === "Receita"
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        isReceita
          ? "bg-[var(--color-success)]/12 text-[var(--color-success)]"
          : "bg-destructive/12 text-destructive",
      )}
    >
      {tipo ?? "—"}
    </Badge>
  )
}
