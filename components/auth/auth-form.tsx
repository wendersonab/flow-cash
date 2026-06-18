"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { resolver } from "@/lib/zod-resolver"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/schemas"
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  type AuthActionResult,
} from "@/app/actions/auth"

type Mode = "login" | "register" | "forgot"

/**
 * Em desenvolvimento, mostra a mensagem real do erro (incluindo o debug do
 * Supabase, ex.: violação de RLS) para facilitar o diagnóstico. Em produção,
 * mostra apenas a mensagem amigável.
 */
function formatAuthError(res: AuthActionResult, fallback: string): string {
  const friendly = res.message ?? fallback
  if (process.env.NODE_ENV === "development" && res.debug) {
    return `${friendly}\n\n[debug] ${res.debug}`
  }
  return friendly
}

export function AuthForm() {
  const [mode, setMode] = React.useState<Mode>("login")

  const title = {
    login: "Entrar",
    register: "Criar conta",
    forgot: "Recuperar senha",
  }[mode]

  const description = {
    login: "Acesse sua conta para gerenciar suas finanças.",
    register: "Crie sua conta gratuita do FlowCash.",
    forgot: "Informe seu e-mail para receber o link de redefinição.",
  }[mode]

  return (
    <Card className="border-border shadow-lg">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "login" ? <LoginFields onForgotPassword={() => setMode("forgot")} /> : null}
        {mode === "register" ? <RegisterFields /> : null}
        {mode === "forgot" ? <ForgotPasswordFields onBackToLogin={() => setMode("login")} /> : null}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Não tem uma conta?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setMode("register")}
              >
                Criar conta
              </button>
            </>
          ) : null}

          {mode === "register" ? (
            <>
              Já tem uma conta?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setMode("login")}
              >
                Entrar
              </button>
            </>
          ) : null}

          {mode === "forgot" ? (
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode("login")}
            >
              Voltar para o login
            </button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function ResetPasswordForm() {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: resolver<ResetPasswordInput>(resetPasswordSchema) })

  const onSubmit = (values: ResetPasswordInput) => {
    setFormError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set("senha", values.senha)
        fd.set("confirmarSenha", values.confirmarSenha)
        const res = await resetPasswordAction(fd)
        if (!res.success) {
          setFormError(formatAuthError(res, "Não foi possível redefinir a senha."))
          return
        }
        toast.success("Senha redefinida com sucesso! Entre com sua nova senha.")
        router.replace("/login")
        router.refresh()
      } catch {
        setFormError("Erro inesperado. Tente novamente.")
      }
    })
  }

  return (
    <Card className="border-border shadow-lg">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-2xl">Criar nova senha</CardTitle>
        <CardDescription>
          Digite uma nova senha segura para recuperar o acesso à sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormError message={formError} />
          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova senha</Label>
            <Input
              id="nova-senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              {...register("senha")}
            />
            {errors.senha ? (
              <p className="text-xs text-destructive">{errors.senha.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-nova-senha">Confirmar nova senha</Label>
            <Input
              id="confirmar-nova-senha"
              type="password"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              {...register("confirmarSenha")}
            />
            {errors.confirmarSenha ? (
              <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Salvar nova senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="whitespace-pre-line rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  )
}

function LoginFields({ onForgotPassword }: { onForgotPassword: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: resolver<LoginInput>(loginSchema) })

  const onSubmit = (values: LoginInput) => {
    setFormError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set("email", values.email)
        fd.set("senha", values.senha)
        const res = await loginAction(fd)
        if (!res.success) {
          setFormError(formatAuthError(res, "Não foi possível entrar."))
          return
        }
        toast.success("Bem-vindo de volta!")
        router.replace("/dashboard")
        router.refresh()
      } catch {
        setFormError("Erro inesperado. Tente novamente.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={formError} />
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="senha">Senha</Label>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={onForgotPassword}
          >
            Esqueci minha senha
          </button>
        </div>
        <Input
          id="senha"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("senha")}
        />
        {errors.senha ? (
          <p className="text-xs text-destructive">{errors.senha.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
      </Button>
    </form>
  )
}

function ForgotPasswordFields({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [pending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: resolver<ForgotPasswordInput>(forgotPasswordSchema) })

  const onSubmit = (values: ForgotPasswordInput) => {
    setFormError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set("email", values.email)
        const res = await forgotPasswordAction(fd)
        if (!res.success) {
          setFormError(formatAuthError(res, "Não foi possível enviar o e-mail."))
          return
        }
        toast.success("Se esse e-mail existir, enviaremos um link de redefinição.")
        onBackToLogin()
      } catch {
        setFormError("Erro inesperado. Tente novamente.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={formError} />
      <div className="space-y-2">
        <Label htmlFor="email-recuperacao">E-mail</Label>
        <Input
          id="email-recuperacao"
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Enviar link de recuperação"}
      </Button>
    </form>
  )
}

function RegisterFields() {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: resolver<RegisterInput>(registerSchema) })

  const onSubmit = (values: RegisterInput) => {
    setFormError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set("nome", values.nome)
        fd.set("email", values.email)
        fd.set("senha", values.senha)
        fd.set("confirmarSenha", values.confirmarSenha)
        const res = await registerAction(fd)
        if (!res.success) {
          setFormError(formatAuthError(res, "Não foi possível criar a conta."))
          return
        }
        if (res.needsConfirmation) {
          toast.success("Conta criada! Confirme seu e-mail para entrar.")
          return
        }
        toast.success("Conta criada com sucesso!")
        router.replace("/dashboard")
        router.refresh()
      } catch {
        setFormError("Erro inesperado. Tente novamente.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={formError} />
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" placeholder="Seu nome" autoComplete="name" {...register("nome")} />
        {errors.nome ? (
          <p className="text-xs text-destructive">{errors.nome.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-reg">E-mail</Label>
        <Input
          id="email-reg"
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha-reg">Senha</Label>
        <Input
          id="senha-reg"
          type="password"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          {...register("senha")}
        />
        {errors.senha ? (
          <p className="text-xs text-destructive">{errors.senha.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmar">Confirmar senha</Label>
        <Input
          id="confirmar"
          type="password"
          placeholder="Repita a senha"
          autoComplete="new-password"
          {...register("confirmarSenha")}
        />
        {errors.confirmarSenha ? (
          <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Criar conta"}
      </Button>
    </form>
  )
}
