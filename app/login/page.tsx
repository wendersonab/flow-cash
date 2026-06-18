import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AuthForm } from "@/components/auth/auth-form"
import { AnimatedChart } from "@/components/animated-chart"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return (
    <main className="flex min-h-screen w-full">
      {/* Coluna esquerda (55%) - oculta no mobile */}
      <section
        className="relative hidden w-[55%] flex-col items-stretch justify-between overflow-hidden pl-[48px] pr-12 pt-12 pb-12 lg:flex"
        style={{ background: "linear-gradient(160deg, #0A0F1E 0%, #0d2137 100%)" }}
      >
        <Logo textClassName="text-white text-xl" />

        <div className="flex flex-col gap-8">
          <AnimatedChart />
          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-semibold leading-tight text-white">
              Controle seu dinheiro.
              <br />
              Realize seus objetivos.
            </h1>
            <p className="max-w-md text-pretty leading-relaxed text-slate-400">
              FlowCash reúne suas movimentações, categorias, metas e relatórios
              em um só lugar, com uma visão clara das suas finanças pessoais.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} FlowCash
        </p>
      </section>

      {/* Coluna direita */}
      <section className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[45%]">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <Logo />
          </div>
          <AuthForm />
        </div>
      </section>
    </main>
  )
}
