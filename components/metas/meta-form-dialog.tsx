"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { resolver } from "@/lib/zod-resolver"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
import { metaSchema, type MetaInput } from "@/lib/schemas"
import { criarMetaAction, editarMetaAction } from "@/app/actions/metas"
import type { MetaFinanceira } from "@/lib/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta?: MetaFinanceira | null
}

export function MetaFormDialog({ open, onOpenChange, meta }: Props) {
  const isEdit = Boolean(meta)
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MetaInput>({
    resolver: resolver<MetaInput>(metaSchema),
    defaultValues: { nome_meta: "", valor_objetivo: undefined, data_limite: "" },
  })

  React.useEffect(() => {
    if (!open) return
    reset({
      nome_meta: meta?.nome_meta ?? "",
      valor_objetivo: meta ? meta.valor_objetivo : undefined,
      data_limite: meta?.data_limite ? meta.data_limite.slice(0, 10) : "",
    })
  }, [open, meta, reset])

  const onSubmit = (values: MetaInput) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set("nome_meta", values.nome_meta)
      fd.set("valor_objetivo", String(values.valor_objetivo))
      fd.set("data_limite", values.data_limite ?? "")
      const res = isEdit
        ? await editarMetaAction(meta!.id_meta, fd)
        : await criarMetaAction(fd)
      if (res.ok) {
        toast.success(isEdit ? "Meta atualizada." : "Meta criada.")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(res.error ?? "Erro ao salvar.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>Defina um objetivo financeiro para alcançar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nome_meta">Nome da meta</Label>
            <Input id="nome_meta" placeholder="Ex: Reserva de emergência" {...register("nome_meta")} />
            {errors.nome_meta ? (
              <p className="text-xs text-destructive">{errors.nome_meta.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor_objetivo">Valor objetivo (R$)</Label>
            <Input
              id="valor_objetivo"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register("valor_objetivo")}
            />
            {errors.valor_objetivo ? (
              <p className="text-xs text-destructive">{errors.valor_objetivo.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_limite">Data limite (opcional)</Label>
            <Input id="data_limite" type="date" {...register("data_limite")} />
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
