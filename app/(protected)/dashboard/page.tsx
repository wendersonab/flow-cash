import { requireUser } from "@/lib/auth"
import {
  resumoMes,
  ultimasTransacoes,
  dadosGraficoMensal,
  gastosPorCategoria,
} from "@/services/transacoesService"
import { contarMetasAtivas } from "@/services/metasService"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { MonthlyChart } from "@/components/charts/monthly-chart"
import { CategoryPieChart } from "@/components/charts/category-pie-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { DashboardPrivacyToggle } from "@/components/dashboard-privacy-toggle"
import { Wallet, TrendingUp, TrendingDown, Target, Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await requireUser()

  const [resumo, ultimas, grafico, gastosCat, metasAtivas] = await Promise.all([
    resumoMes(user.id_usuario),
    ultimasTransacoes(user.id_usuario, 8),
    dadosGraficoMensal(user.id_usuario),
    gastosPorCategoria(user.id_usuario),
    contarMetasAtivas(user.id_usuario),
  ])

  const primeiroNome = user.nome.split(" ")[0]

  return (
    <div>
      <PageHeader
        title={`Olá, ${primeiroNome}`}
        description="Aqui está o resumo financeiro do mês atual."
      >
        <DashboardPrivacyToggle />
        <Link href="/movimentacoes?novo=1" className={buttonVariants()}>
          <Plus className="size-4" />
          Nova movimentação
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Saldo do mês" icon={Wallet} value={resumo.saldo} tone="auto" />
        <StatCard title="Receitas" icon={TrendingUp} value={resumo.receitas} tone="positive" />
        <StatCard
          title="Despesas"
          icon={TrendingDown}
          value={resumo.despesas}
          tone="negative"
          absolute
        />
        <StatCard title="Metas ativas" icon={Target} rawValue={metasAtivas} hint="em andamento" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução dos últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={grafico} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={gastosCat} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas movimentações</CardTitle>
            <Link href="/movimentacoes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            <RecentTransactions itens={ultimas} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
