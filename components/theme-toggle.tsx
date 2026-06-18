"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { atualizarPreferenciasAction } from "@/app/actions/configuracoes"
import { usePrivacy } from "@/components/providers/privacy-provider"
import { Button } from "@/components/ui/button"
import type { TemaPreferido } from "@/lib/types"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { hideValues } = usePrivacy()
  const [mounted, setMounted] = React.useState(false)
  const [, startTransition] = React.useTransition()

  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  function toggleTheme() {
    const nextTheme: TemaPreferido = isDark ? "light" : "dark"
    setTheme(nextTheme)

    startTransition(async () => {
      const res = await atualizarPreferenciasAction({
        tema_preferido: nextTheme,
        ocultar_valores: hideValues,
      })

      if (!res.ok) {
        toast.error(res.message ?? "Tema alterado nesta sessão, mas não foi salvo no perfil.")
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar tema claro/escuro"
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
