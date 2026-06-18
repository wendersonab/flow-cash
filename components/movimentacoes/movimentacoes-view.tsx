"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { TransactionBadge } from "@/components/transaction-badge"
import { MoneyValue } from "@/components/money-value"
import { EmptyState } from "@/components/empty-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TransactionFormDialog } from "@/components/movimentacoes/transaction-form-dialog"
import { formatDateBR } from "@/lib/format"
import { excluirTransacaoAction } from "@/app/actions/transacoes"
import type { Categoria, TransacaoComCategoria } from "@/lib/types"
import { Receipt } from "lucide-react"

interface Props {
  itens: TransacaoComCategoria[]
  total: number
  page: number
  pageSize: number
  categorias: Categoria[]
  filtros: {
    tipo: string
    id_categoria: string
    dataInicio: string
    dataFim: string
    busca: string
  }
  abrirNovo: boolean
}

export function MovimentacoesView({
  itens,
  total,
  page,
  pageSize,
  categorias,
  filtros,
  abrirNovo,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [formOpen, setFormOpen] = React.useState(abrirNovo)
  const [editing, setEditing] = React.useState<TransacaoComCategoria | null>(null)
  const [toDelete, setToDelete] = React.useState<TransacaoComCategoria | null>(null)
  const [deleting, startDelete] = React.useTransition()
  const [busca, setBusca] = React.useState(filtros.busca)
  const [dataInicio, setDataInicio] = React.useState(filtros.dataInicio)
  const [dataFim, setDataFim] = React.useState(filtros.dataFim)
  const [dateError, setDateError] = React.useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const DATE_RANGE_MESSAGE = "A data de início não pode ser depois da data final."

  const handleDataInicio = (value: string) => {
    setDataInicio(value)
    if (value && dataFim && new Date(value) > new Date(dataFim)) {
      setDateError(DATE_RANGE_MESSAGE)
      toast.error(DATE_RANGE_MESSAGE)
      return
    }
    setDateError(null)
    updateParams({ dataInicio: value })
  }

  const handleDataFim = (value: string) => {
    setDataFim(value)
    if (dataInicio && value && new Date(dataInicio) > new Date(value)) {
      setDateError(DATE_RANGE_MESSAGE)
      toast.error(DATE_RANGE_MESSAGE)
      return
    }
    setDateError(null)
    updateParams({ dataFim: value })
  }

  const updateParams = React.useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "Todos" || value === "all") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      if (resetPage) params.delete("page")
      params.delete("novo")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  // Debounce busca
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (busca !== filtros.busca) updateParams({ busca })
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (t: TransacaoComCategoria) => {
    setEditing(t)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!toDelete) return
    startDelete(async () => {
      const res = await excluirTransacaoAction(toDelete.id_transacao)
      if (res.ok) {
        toast.success("Movimentação excluída.")
        setToDelete(null)
        router.refresh()
      } else {
        toast.error(res.error ?? "Erro ao excluir.")
      }
    })
  }

  const onFormOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditing(null)
      router.refresh()
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Movimentações</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "registro" : "registros"} encontrados
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Nova movimentação
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar descrição"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filtros.tipo || "Todos"}
            onValueChange={(v) => updateParams({ tipo: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os tipos</SelectItem>
              <SelectItem value="Entrada">Entradas</SelectItem>
              <SelectItem value="Saída">Saídas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtros.id_categoria || "all"}
            onValueChange={(v) => updateParams({ id_categoria: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>
                  {c.nome_categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dataInicio}
            max={dataFim || undefined}
            onChange={(e) => handleDataInicio(e.target.value)}
            aria-invalid={Boolean(dateError)}
            aria-label="Data inicial"
          />
          <Input
            type="date"
            value={dataFim}
            min={dataInicio || undefined}
            onChange={(e) => handleDataFim(e.target.value)}
            aria-invalid={Boolean(dateError)}
            aria-label="Data final"
          />

          {dateError && (
            <p
              role="alert"
              className="text-sm font-medium text-destructive sm:col-span-2 lg:col-span-5"
            >
              {dateError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {itens.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Receipt}
                title="Nenhuma movimentação"
                description="Ajuste os filtros ou crie sua primeira movimentação."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[1%]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((t) => (
                    <TableRow key={t.id_transacao}>
                      <TableCell>
                        <TransactionBadge valor={t.valor} />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {t.descricao || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.categoria?.nome_categoria ?? "Sem categoria"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateBR(t.data_transacao)}
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyValue value={t.valor} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(t)}
                            aria-label="Editar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setToDelete(t)}
                            aria-label="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) }, false)}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) }, false)}
            >
              Próxima
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        categorias={categorias}
        transacao={editing}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir movimentação?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
