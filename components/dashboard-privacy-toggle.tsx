"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { atualizarPreferenciasAction } from "@/app/actions/configuracoes"
import { usePrivacy } from "@/components/providers/privacy-provider"
import { Button } from "@/components/ui/button"
import type { TemaPreferido } from "@/lib/types"

function normalizeTheme(theme: string | undefined): TemaPreferido {
  if (theme === "light" || theme === "dark" || theme === "system") return theme
  return "system"
}

export function DashboardPrivacyToggle() {
  const { hideValues, setHideValues } = usePrivacy()
  const { theme } = useTheme()
  const [, startTransition] = React.useTransition()

  function togglePrivacy() {
    const next = !hideValues
    setHideValues(next)
    toast.success(next ? "Valores financeiros ocultos." : "Valores financeiros visíveis.")

    startTransition(async () => {
      const res = await atualizarPreferenciasAction({
        tema_preferido: normalizeTheme(theme),
        ocultar_valores: next,
      })

      if (!res.ok) {
        toast.error(res.message ?? "Privacidade alterada nesta sessão, mas não foi salva no perfil.")
      }
    })
  }

  return (
    <Button type="button" variant="outline" onClick={togglePrivacy}>
      {hideValues ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      {hideValues ? "Mostrar valores" : "Ocultar valores"}
    </Button>
  )
}
