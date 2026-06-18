"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { atualizarPreferenciasAction } from "@/app/actions/configuracoes"
import { usePrivacy } from "@/components/providers/privacy-provider"
import type { TemaPreferido } from "@/lib/types"

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable
}

export function ThemeShortcut() {
  const { resolvedTheme, setTheme } = useTheme()
  const { hideValues } = usePrivacy()
  const resolvedThemeRef = React.useRef(resolvedTheme)
  const hideValuesRef = React.useRef(hideValues)
  const [, startTransition] = React.useTransition()

  React.useEffect(() => {
    resolvedThemeRef.current = resolvedTheme
  }, [resolvedTheme])

  React.useEffect(() => {
    hideValuesRef.current = hideValues
  }, [hideValues])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "t") return
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      if (isTypingTarget(event.target)) return

      const nextTheme: TemaPreferido = resolvedThemeRef.current === "dark" ? "light" : "dark"
      setTheme(nextTheme)
      toast.success(nextTheme === "dark" ? "Tema escuro ativado" : "Tema claro ativado")

      startTransition(async () => {
        const res = await atualizarPreferenciasAction({
          tema_preferido: nextTheme,
          ocultar_valores: hideValuesRef.current,
        })

        if (!res.ok) {
          toast.error(res.message ?? "Tema alterado nesta sessão, mas não foi salvo no perfil.")
        }
      })
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [setTheme, startTransition])

  return null
}
