import { requireUser } from "@/lib/auth"
import { listarCategoriasDoUsuario } from "@/services/categoriasService"
import { CategoriasView } from "@/components/categorias/categorias-view"

export const dynamic = "force-dynamic"

export default async function CategoriasPage() {
  const user = await requireUser()
  const categorias = await listarCategoriasDoUsuario(user.id_usuario)
  return <CategoriasView categorias={categorias} />
}
