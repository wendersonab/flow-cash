import Link from "next/link"
import { CheckCircle2, LayoutDashboard } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

export default function AuthVerifiedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md border-border text-center shadow-lg">
        <CardHeader className="items-center space-y-4">
          <Logo className="justify-center" />
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <CheckCircle2 className="size-9" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Conta verificada com sucesso!</CardTitle>
            <CardDescription className="text-pretty leading-relaxed">
              Seu e-mail foi confirmado e sua conta FlowCash está pronta para uso.
              Agora você já pode acessar seu painel financeiro.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/dashboard" className={cn(buttonVariants(), "w-full gap-2")}>
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Ir para o dashboard
          </Link>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Se o botão não abrir o painel, volte para o login e entre com seu e-mail e senha.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
