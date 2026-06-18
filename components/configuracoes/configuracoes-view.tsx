"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  Camera,
  Check,
  EyeOff,
  KeyRound,
  Monitor,
  Moon,
  ShieldAlert,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react"

import { atualizarAvatarAction, atualizarPerfilAction, atualizarPreferenciasAction, alterarSenhaAction, excluirContaAction, removerAvatarAction } from "@/app/actions/configuracoes"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { usePrivacy } from "@/components/providers/privacy-provider"
import { cn } from "@/lib/utils"
import type { SessionUser, TemaPreferido } from "@/lib/types"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function SectionIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary", className)}>
      {children}
    </div>
  )
}

export function ConfiguracoesView({ user }: { user: SessionUser }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { hideValues, setHideValues } = usePrivacy()
  const [pending, startTransition] = React.useTransition()
  const senhaFormRef = React.useRef<HTMLFormElement>(null)
  const avatarFormRef = React.useRef<HTMLFormElement>(null)
  const [selectedTheme, setSelectedTheme] = React.useState<TemaPreferido>(
    (user.tema_preferido ?? "system") as TemaPreferido,
  )

  React.useEffect(() => {
    if (theme === "system" || theme === "light" || theme === "dark") {
      setSelectedTheme(theme)
    }
  }, [theme])

  const temaAtual = selectedTheme

  function toastResult(res: { ok: boolean; message?: string; debug?: string }) {
    if (res.ok) toast.success(res.message ?? "Alteração salva.")
    else toast.error(res.message ?? "Não foi possível salvar.")
    if (!res.ok && res.debug && process.env.NODE_ENV === "development") {
      console.error("[debug configurações]", res.debug)
    }
  }

  function salvarPerfil(formData: FormData) {
    startTransition(async () => {
      const res = await atualizarPerfilAction(formData)
      toastResult(res)
      if (res.ok) router.refresh()
    })
  }

  function salvarAvatar(formData: FormData) {
    startTransition(async () => {
      const res = await atualizarAvatarAction(formData)
      toastResult(res)
      if (res.ok) {
        avatarFormRef.current?.reset()
        router.refresh()
      }
    })
  }

  function removerAvatar() {
    startTransition(async () => {
      const res = await removerAvatarAction()
      toastResult(res)
      if (res.ok) router.refresh()
    })
  }

  function salvarSenha(formData: FormData) {
    startTransition(async () => {
      const res = await alterarSenhaAction(formData)
      toastResult(res)
      if (res.ok) senhaFormRef.current?.reset()
    })
  }

  function salvarPreferencias(next: { tema_preferido: TemaPreferido; ocultar_valores: boolean }) {
    startTransition(async () => {
      const res = await atualizarPreferenciasAction(next)
      if (!res.ok) toastResult(res)
    })
  }

  function escolherTema(nextTheme: TemaPreferido) {
    setSelectedTheme(nextTheme)
    setTheme(nextTheme)
    salvarPreferencias({ tema_preferido: nextTheme, ocultar_valores: hideValues })
  }

  function alternarPrivacidade() {
    const next = !hideValues
    setHideValues(next)
    toast.success(next ? "Valores financeiros ocultos." : "Valores financeiros visíveis.")
    salvarPreferencias({ tema_preferido: temaAtual, ocultar_valores: next })
  }

  function excluirConta(formData: FormData) {
    startTransition(async () => {
      const res = await excluirContaAction(formData)
      toastResult(res)
      if (res.ok) router.replace("/login")
    })
  }

  const themeOptions: Array<{ value: TemaPreferido; label: string; icon: React.ElementType; description: string }> = [
    { value: "system", label: "Sistema", icon: Monitor, description: "Segue o tema do dispositivo." },
    { value: "light", label: "Claro", icon: Sun, description: "Interface clara." },
    { value: "dark", label: "Escuro", icon: Moon, description: "Interface escura." },
  ]

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Gerencie seu perfil, segurança, aparência e privacidade."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <SectionIcon>
                <UserRound className="size-5" />
              </SectionIcon>
              <div>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Atualize as informações principais da sua conta.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form ref={avatarFormRef} action={salvarAvatar} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="size-20">
                  {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.nome} /> : null}
                  <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                    {initials(user.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatar">Foto de perfil</Label>
                  <Input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                  <p className="text-xs text-muted-foreground">PNG, JPG, WebP ou GIF até 2 MB.</p>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <Button type="submit" disabled={pending}>
                    <Camera className="size-4" />
                    Enviar
                  </Button>
                  {user.avatar_url ? (
                    <Button type="button" variant="outline" disabled={pending} onClick={removerAvatar}>
                      Remover
                    </Button>
                  ) : null}
                </div>
              </form>

              <Separator />

              <form action={salvarPerfil} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" name="nome" defaultValue={user.nome} autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" defaultValue={user.email} autoComplete="email" />
                  <p className="text-xs text-muted-foreground">Se alterar, confirme o novo e-mail pelo link enviado.</p>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={pending}>Salvar perfil</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <SectionIcon>
                <KeyRound className="size-5" />
              </SectionIcon>
              <div>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Altere sua senha ou remova sua conta de forma segura.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form ref={senhaFormRef} action={salvarSenha} className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha atual</Label>
                  <Input id="senhaAtual" name="senhaAtual" type="password" autoComplete="current-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova senha</Label>
                  <Input id="novaSenha" name="novaSenha" type="password" autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarNovaSenha">Confirmar nova senha</Label>
                  <Input id="confirmarNovaSenha" name="confirmarNovaSenha" type="password" autoComplete="new-password" />
                </div>
                <div className="sm:col-span-3">
                  <Button type="submit" disabled={pending}>Alterar senha</Button>
                </div>
              </form>

              <Separator />

              <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <SectionIcon className="bg-destructive/10 text-destructive">
                    <ShieldAlert className="size-5" />
                  </SectionIcon>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-semibold text-destructive">Excluir conta</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Esta ação apaga seu perfil, movimentações, categorias, metas e foto de perfil. Não é possível desfazer.
                      </p>
                    </div>
                    <form action={excluirConta} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="confirmacao">Digite EXCLUIR para confirmar</Label>
                        <Input id="confirmacao" name="confirmacao" placeholder="EXCLUIR" autoComplete="off" />
                      </div>
                      <Button type="submit" variant="destructive" disabled={pending}>
                        <Trash2 className="size-4" />
                        Excluir minha conta
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Escolha o tema do FlowCash. Pressione T para alternar rápido entre claro e escuro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const active = temaAtual === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => escolherTema(option.value)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted",
                      active ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    {active ? <Check className="size-4 text-primary" /> : null}
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacidade</CardTitle>
              <CardDescription>Controle como seus valores financeiros aparecem na tela.</CardDescription>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={alternarPrivacidade}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted",
                  hideValues ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <EyeOff className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Ocultar valores financeiros</p>
                  <p className="text-xs text-muted-foreground">
                    {hideValues ? "Valores estão ocultos no dashboard e relatórios." : "Valores aparecem normalmente."}
                  </p>
                </div>
                {hideValues ? <Check className="size-4 text-primary" /> : null}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
