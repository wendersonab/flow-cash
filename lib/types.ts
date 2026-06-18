// Tipos correspondentes ao schema EXISTENTE no Supabase.
// Não alterar nomes de tabelas/colunas.

export interface Endereco {
  id_endereco: number
  rua: string | null
  numero: number | null
  cep: string | null
  cidade: string | null
  uf: string | null
}

export type TemaPreferido = "system" | "light" | "dark"

export interface Usuario {
  id_usuario: number
  nome: string
  email: string
  senha_hash: string
  id_endereco: number | null
  auth_user_id?: string | null
  avatar_url?: string | null
  avatar_path?: string | null
  tema_preferido?: TemaPreferido | null
  ocultar_valores?: boolean | null
}

export type TipoCategoria = "Receita" | "Despesa"

export interface Categoria {
  id_categoria: number
  nome_categoria: string
  tipo_categoria: string | null
  id_usuario: number
}

export interface Transacao {
  id_transacao: number
  valor: number
  data_transacao: string // YYYY-MM-DD
  descricao: string | null
  id_usuario: number
  id_categoria: number | null
}

export interface MetaFinanceira {
  id_meta: number
  nome_meta: string
  valor_objetivo: number
  valor_atual: number
  data_limite: string | null
  id_usuario: number
}

// Transação com categoria embutida (join)
export interface TransacaoComCategoria extends Transacao {
  categoria: Pick<Categoria, "id_categoria" | "nome_categoria" | "tipo_categoria"> | null
}

// Sessão local mínima
export interface SessionUser {
  id_usuario: number
  nome: string
  email: string
  avatar_url?: string | null
  avatar_path?: string | null
  tema_preferido?: TemaPreferido | null
  ocultar_valores?: boolean | null
}
