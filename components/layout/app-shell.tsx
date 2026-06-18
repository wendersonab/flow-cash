"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { PrivacyProvider } from "@/components/providers/privacy-provider"
import { ThemeShortcut } from "@/components/theme-shortcut"
import type { SessionUser } from "@/lib/types"

export function AppShell({
  user,
  children,
}: {
  user: Pick<SessionUser, "nome" | "email" | "avatar_url" | "ocultar_valores" | "tema_preferido">
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { setTheme } = useTheme()
  const appliedInitialTheme = useRef(false)

  useEffect(() => {
    if (appliedInitialTheme.current) return
    appliedInitialTheme.current = true

    if (user.tema_preferido) {
      setTheme(user.tema_preferido)
    }
  }, [setTheme, user.tema_preferido])

  return (
    <PrivacyProvider initialHideValues={Boolean(user.ocultar_valores)}>
      <ThemeShortcut />
      <div className="flex min-h-screen bg-background">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </PrivacyProvider>
  )
}
