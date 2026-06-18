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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { categoriaSchema, type CategoriaInput } from "@/lib/schemas"
import { criarCategoriaAction, editarCategoriaAction } from "@/app/actions/categorias"
import type { CategoriaComContagem } from "@/services/categoriasService"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria?: CategoriaComContagem | null
}

export function CategoryFormDialog({ open, onOpenChange, categoria }: Props) {
  const isEdit = Boolean(categoria)
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoriaInput>({
    resolver: resolver<CategoriaInput>(categoriaSchema),
    defaultValues: { nome_categoria: "", tipo_categoria: "Despesa" },
  })

  React.useEffect(() => {
    if (!open) return
    reset({
      nome_categoria: categoria?.nome_categoria ?? "",
      tipo_categoria: (categoria?.tipo_categoria as "Receita" | "Despesa") ?? "Despesa",
    })
  }, [open, categoria, reset])

  const tipo = watch("tipo_categoria")

  const onSubmit = (values: CategoriaInput) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set("nome_categoria", values.nome_categoria)
      fd.set("tipo_categoria", values.tipo_categoria)
      const res = isEdit
        ? await editarCategoriaAction(categoria!.id_categoria, fd)
        : await criarCategoriaAction(fd)
      if (res.ok) {
        toast.success(isEdit ? "Categoria atualizada." : "Categoria criada.")
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
          <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Organize suas movimentações por categoria.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nome_categoria">Nome</Label>
            <Input id="nome_categoria" placeholder="Ex: Alimentação" {...register("nome_categoria")} />
            {errors.nome_categoria ? (
              <p className="text-xs text-destructive">{errors.nome_categoria.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setValue("tipo_categoria", v as "Receita" | "Despesa")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
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
