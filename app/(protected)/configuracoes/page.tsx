import { requireUser } from "@/lib/auth"
import { ConfiguracoesView } from "@/components/configuracoes/configuracoes-view"

export const dynamic = "force-dynamic"

export default async function ConfiguracoesPage() {
  const user = await requireUser()
  return <ConfiguracoesView user={user} />
}
