import { requireUser } from "@/lib/auth"
import {
  resumoPorPeriodo,
  receitasDespesasPorMes,
  evolucaoSaldo,
  resumoPorCategoria,
  type PeriodoRange,
} from "@/services/relatoriosService"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PeriodSelector } from "@/components/relatorios/period-selector"
import { ReceitasDespesasBar } from "@/components/charts/receitas-despesas-bar"
import { SaldoLineChart } from "@/components/charts/saldo-line-chart"
import { MoneyValue } from "@/components/money-value"
import { EmptyState } from "@/components/empty-state"
import { Wallet, TrendingUp, TrendingDown, Crown, PieChart } from "lucide-react"

export const dynamic = "force-dynamic"

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function calcularPeriodo(periodo: string): PeriodoRange {
  const now = new Date()
  const fim = iso(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  if (periodo === "year") {
    return { inicio: `${now.getFullYear()}-01-01`, fim }
  }
  const meses = Number(periodo) || 6
  const inicioDate = new Date(now.getFullYear(), now.getMonth() - (meses - 1), 1)
  return { inicio: iso(inicioDate), fim }
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireUser()
  const sp = await searchParams
  const periodoParam = (Array.isArray(sp.periodo) ? sp.periodo[0] : sp.periodo) ?? "6"
  const periodo = calcularPeriodo(periodoParam)

  const [resumo, porMes, saldo, porCategoria] = await Promise.all([
    resumoPorPeriodo(user.id_usuario, periodo),
    receitasDespesasPorMes(user.id_usuario, periodo),
    evolucaoSaldo(user.id_usuario, periodo),
    resumoPorCategoria(user.id_usuario, periodo),
  ])

  return (
    <div>
      <PageHeader title="Relatórios" description="Analise suas finanças ao longo do tempo.">
        <PeriodSelector value={periodoParam} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Receitas" icon={TrendingUp} value={resumo.receitas} tone="positive" />
        <StatCard title="Despesas" icon={TrendingDown} value={resumo.despesas} tone="negative" absolute />
        <StatCard title="Saldo do período" icon={Wallet} value={resumo.saldo} tone="auto" />
        <StatCard
          title="Maior gasto"
          icon={Crown}
          rawValue={resumo.maiorCategoria?.categoria ?? "—"}
          hint={resumo.maiorCategoria ? <MoneyValue value={resumo.maiorCategoria.total} tone="negative" /> : "Sem despesas"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas x Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceitasDespesasBar data={porMes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução do saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <SaldoLineChart data={saldo} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {porCategoria.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={PieChart}
                  title="Sem despesas no período"
                  description="Não há gastos registrados para análise."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[40%]">Participação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porCategoria.map((c) => (
                      <TableRow key={c.categoria}>
                        <TableCell className="font-medium">{c.categoria}</TableCell>
                        <TableCell className="text-right">
                          <MoneyValue value={c.total} tone="negative" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${c.percentual}%` }}
                              />
                            </div>
                            <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">
                              {c.percentual}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
