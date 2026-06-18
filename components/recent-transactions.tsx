import { TransactionBadge } from "@/components/transaction-badge"
import { MoneyValue } from "@/components/money-value"
import { formatDateBR } from "@/lib/format"
import { EmptyState } from "@/components/empty-state"
import { Receipt } from "lucide-react"
import type { TransacaoComCategoria } from "@/lib/types"

export function RecentTransactions({ itens }: { itens: TransacaoComCategoria[] }) {
  if (!itens.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhuma movimentação"
        description="Suas movimentações mais recentes aparecerão aqui."
      />
    )
  }

  return (
    <ul className="divide-y divide-border">
      {itens.map((t) => (
        <li key={t.id_transacao} className="flex items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <TransactionBadge valor={t.valor} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {t.descricao || "Sem descrição"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t.categoria?.nome_categoria ?? "Sem categoria"} · {formatDateBR(t.data_transacao)}
              </p>
            </div>
          </div>
          <MoneyValue value={t.valor} className="shrink-0 text-sm" />
        </li>
      ))}
    </ul>
  )
}
