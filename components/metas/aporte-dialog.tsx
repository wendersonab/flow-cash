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
import { aporteSchema, type AporteInput } from "@/lib/schemas"
import { adicionarAporteAction } from "@/app/actions/metas"
import type { MetaFinanceira } from "@/lib/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta: MetaFinanceira | null
}

export function AporteDialog({ open, onOpenChange, meta }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AporteInput>({
    resolver: resolver<AporteInput>(aporteSchema),
    defaultValues: { valor: undefined },
  })

  React.useEffect(() => {
    if (open) reset({ valor: undefined })
  }, [open, reset])

  const onSubmit = (values: AporteInput) => {
    if (!meta) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set("valor", String(values.valor))
      const res = await adicionarAporteAction(meta.id_meta, fd)
      if (res.ok) {
        toast.success("Aporte adicionado.")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(res.error ?? "Erro ao adicionar aporte.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar aporte</DialogTitle>
          <DialogDescription>
            {meta ? `Quanto deseja guardar em "${meta.nome_meta}"?` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="valor-aporte">Valor (R$)</Label>
            <Input
              id="valor-aporte"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              autoFocus
              {...register("valor")}
            />
            {errors.valor ? (
              <p className="text-xs text-destructive">{errors.valor.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
