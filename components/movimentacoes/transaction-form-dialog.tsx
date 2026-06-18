"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { resolver } from "@/lib/zod-resolver"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { transacaoSchema, type TransacaoInput } from "@/lib/schemas"
import { criarTransacaoAction, editarTransacaoAction } from "@/app/actions/transacoes"
import type { Categoria, TransacaoComCategoria } from "@/lib/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categorias: Pick<Categoria, "id_categoria" | "nome_categoria" | "tipo_categoria">[]
  transacao?: TransacaoComCategoria | null
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function TransactionFormDialog({ open, onOpenChange, categorias, transacao }: Props) {
  const isEdit = Boolean(transacao)
  const [pending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransacaoInput>({
    resolver: resolver<TransacaoInput>(transacaoSchema),
    defaultValues: {
      valor: undefined,
      tipo: "Saída",
      data_transacao: todayISO(),
      descricao: "",
      id_categoria: "none",
    },
  })

  React.useEffect(() => {
    if (!open) return
    if (transacao) {
      reset({
        valor: Math.abs(transacao.valor),
        tipo: transacao.valor >= 0 ? "Entrada" : "Saída",
        data_transacao: transacao.data_transacao.slice(0, 10),
        descricao: transacao.descricao ?? "",
        id_categoria: transacao.id_categoria ? String(transacao.id_categoria) : "none",
      })
    } else {
      reset({
        valor: undefined,
        tipo: "Saída",
        data_transacao: todayISO(),
        descricao: "",
        id_categoria: "none",
      })
    }
  }, [open, transacao, reset])

  const tipo = watch("tipo")
  const idCategoria = watch("id_categoria")

  // Filtra categorias compatíveis com o tipo selecionado
  const tipoCat = tipo === "Entrada" ? "Receita" : "Despesa"
  const categoriasFiltradas = categorias.filter((c) => c.tipo_categoria === tipoCat)

  const onSubmit = (values: TransacaoInput) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set("valor", String(values.valor))
      fd.set("tipo", values.tipo)
      fd.set("data_transacao", values.data_transacao)
      fd.set("descricao", values.descricao ?? "")
      fd.set("id_categoria", values.id_categoria ?? "none")

      const res = isEdit
        ? await editarTransacaoAction(transacao!.id_transacao, fd)
        : await criarTransacaoAction(fd)

      if (res.ok) {
        toast.success(isEdit ? "Movimentação atualizada." : "Movimentação criada.")
        onOpenChange(false)
      } else {
        toast.error(res.error ?? "Erro ao salvar.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar movimentação" : "Nova movimentação"}</DialogTitle>
          <DialogDescription>
            Preencha os dados da movimentação financeira.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => {
                  setValue("tipo", v as "Entrada" | "Saída")
                  setValue("id_categoria", "none")
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saída">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register("valor")}
              />
              {errors.valor ? (
                <p className="text-xs text-destructive">{errors.valor.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" {...register("data_transacao")} />
            {errors.data_transacao ? (
              <p className="text-xs text-destructive">{errors.data_transacao.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={idCategoria ?? "none"}
              onValueChange={(v) => setValue("id_categoria", v ?? "none")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categoriasFiltradas.map((c) => (
                  <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>
                    {c.nome_categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" placeholder="Opcional" {...register("descricao")} />
            {errors.descricao ? (
              <p className="text-xs text-destructive">{errors.descricao.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
