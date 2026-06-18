"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Tags } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CategoryFormDialog } from "@/components/categorias/category-form-dialog"
import { excluirCategoriaAction } from "@/app/actions/categorias"
import type { CategoriaComContagem } from "@/services/categoriasService"

export function CategoriasView({ categorias }: { categorias: CategoriaComContagem[] }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CategoriaComContagem | null>(null)
  const [toDelete, setToDelete] = React.useState<CategoriaComContagem | null>(null)
  const [deleting, startDelete] = React.useTransition()

  const receitas = categorias.filter((c) => c.tipo_categoria === "Receita")
  const despesas = categorias.filter((c) => c.tipo_categoria === "Despesa")

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (c: CategoriaComContagem) => {
    setEditing(c)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!toDelete) return
    startDelete(async () => {
      const res = await excluirCategoriaAction(toDelete.id_categoria)
      if (res.ok) {
        toast.success("Categoria excluída.")
        setToDelete(null)
        router.refresh()
      } else {
        toast.error(res.error ?? "Erro ao excluir.")
      }
    })
  }

  const renderGroup = (titulo: string, lista: CategoriaComContagem[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {lista.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma categoria.</p>
        ) : (
          <ul className="space-y-2">
            {lista.map((c) => (
              <li
                key={c.id_categoria}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{c.nome_categoria}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.total_transacoes} {c.total_transacoes === 1 ? "transação" : "transações"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setToDelete(c)}
                    aria-label="Excluir"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize receitas e despesas em categorias.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Nova categoria
        </Button>
      </div>

      {categorias.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Tags}
              title="Nenhuma categoria"
              description="Crie categorias para organizar suas movimentações."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {renderGroup("Receitas", receitas)}
          {renderGroup("Despesas", despesas)}
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setEditing(null)
        }}
        categoria={editing}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir categoria?"
        description={
          toDelete && toDelete.total_transacoes > 0
            ? `Esta categoria possui ${toDelete.total_transacoes} transação(ões). Elas ficarão sem categoria.`
            : "Esta ação não pode ser desfeita."
        }
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
