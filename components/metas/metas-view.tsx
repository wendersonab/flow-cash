"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Target, PiggyBank } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { MetaFormDialog } from "@/components/metas/meta-form-dialog"
import { AporteDialog } from "@/components/metas/aporte-dialog"
import { MoneyValue } from "@/components/money-value"
import {
  formatDateBR,
  calculateGoalProgress,
  calculateGoalStatus,
  daysUntil,
} from "@/lib/format"
import { excluirMetaAction } from "@/app/actions/metas"
import { cn } from "@/lib/utils"
import type { MetaFinanceira } from "@/lib/types"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Concluída": "bg-[var(--color-success)]/12 text-[var(--color-success)]",
    "Atrasada": "bg-destructive/12 text-destructive",
    "Em andamento": "bg-[var(--color-warning)]/12 text-[var(--color-warning)]",
  }
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", map[status])}>
      {status}
    </Badge>
  )
}

export function MetasView({ metas }: { metas: MetaFinanceira[] }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = React.useState(false)
  const [aporteOpen, setAporteOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<MetaFinanceira | null>(null)
  const [aporteMeta, setAporteMeta] = React.useState<MetaFinanceira | null>(null)
  const [toDelete, setToDelete] = React.useState<MetaFinanceira | null>(null)
  const [deleting, startDelete] = React.useTransition()

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!toDelete) return
    startDelete(async () => {
      const res = await excluirMetaAction(toDelete.id_meta)
      if (res.ok) {
        toast.success("Meta excluída.")
        setToDelete(null)
        router.refresh()
      } else {
        toast.error(res.error ?? "Erro ao excluir.")
      }
    })
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Metas</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus objetivos financeiros.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Nova meta
        </Button>
      </div>

      {metas.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Target}
              title="Nenhuma meta"
              description="Crie sua primeira meta financeira e comece a poupar."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metas.map((m) => {
            const progresso = calculateGoalProgress(m.valor_atual, m.valor_objetivo)
            const status = calculateGoalStatus(m)
            const dias = daysUntil(m.data_limite)
            const concluida = status === "Concluída"
            return (
              <Card key={m.id_meta} className="flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <CardTitle className="text-base leading-tight">{m.nome_meta}</CardTitle>
                  <StatusBadge status={status} />
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <MoneyValue value={m.valor_atual} tone="positive" className="text-lg" />
                    <span className="text-sm text-muted-foreground">
                      de <MoneyValue value={m.valor_objetivo} tone="neutral" />
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          concluida ? "bg-[var(--color-success)]" : "bg-primary",
                        )}
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{progresso}% concluído</span>
                      {m.data_limite ? (
                        <span>
                          {dias !== null && dias >= 0
                            ? `${dias} dia(s) restantes`
                            : `Venceu em ${formatDateBR(m.data_limite)}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={concluida}
                    onClick={() => {
                      setAporteMeta(m)
                      setAporteOpen(true)
                    }}
                  >
                    <PiggyBank className="size-4" />
                    Aporte
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(m)
                      setFormOpen(true)
                    }}
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setToDelete(m)}
                    aria-label="Excluir"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <MetaFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setEditing(null)
        }}
        meta={editing}
      />

      <AporteDialog
        open={aporteOpen}
        onOpenChange={(o) => {
          setAporteOpen(o)
          if (!o) setAporteMeta(null)
        }}
        meta={aporteMeta}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir meta?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
