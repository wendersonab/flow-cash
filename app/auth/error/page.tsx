import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Não foi possível autenticar</h1>
        <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
          O link de confirmação é inválido ou expirou. Tente entrar novamente ou
          solicite um novo cadastro.
        </p>
      </div>
      <Link href="/login" className={buttonVariants()}>
        Voltar para o login
      </Link>
    </main>
  )
}
