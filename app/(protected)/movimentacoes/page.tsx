import { requireUser } from "@/lib/auth"
import { listarTransacoes } from "@/services/transacoesService"
import { listarCategoriasDoUsuario } from "@/services/categoriasService"
import { MovimentacoesView } from "@/components/movimentacoes/movimentacoes-view"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 10

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireUser()
  const sp = await searchParams

  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

  const tipo = str(sp.tipo) as "Entrada" | "Saída" | ""
  const idCategoriaStr = str(sp.id_categoria)
  const dataInicio = str(sp.dataInicio)
  const dataFim = str(sp.dataFim)
  const busca = str(sp.busca)
  const page = Math.max(1, Number(str(sp.page)) || 1)
  const abrirNovo = str(sp.novo) === "1"

  const [lista, categorias] = await Promise.all([
    listarTransacoes(user.id_usuario, {
      tipo: tipo || "Todos",
      id_categoria: idCategoriaStr ? Number(idCategoriaStr) : null,
      dataInicio: dataInicio || null,
      dataFim: dataFim || null,
      busca: busca || null,
      page,
      pageSize: PAGE_SIZE,
    }),
    listarCategoriasDoUsuario(user.id_usuario),
  ])

  return (
    <MovimentacoesView
      itens={lista.itens}
      total={lista.total}
      page={lista.page}
      pageSize={lista.pageSize}
      categorias={categorias}
      filtros={{
        tipo,
        id_categoria: idCategoriaStr,
        dataInicio,
        dataFim,
        busca,
      }}
      abrirNovo={abrirNovo}
    />
  )
}
