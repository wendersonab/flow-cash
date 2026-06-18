import { requireUser } from "@/lib/auth"
import { listarMetas } from "@/services/metasService"
import { MetasView } from "@/components/metas/metas-view"

export const dynamic = "force-dynamic"

export default async function MetasPage() {
  const user = await requireUser()
  const metas = await listarMetas(user.id_usuario)
  return <MetasView metas={metas} />
}
