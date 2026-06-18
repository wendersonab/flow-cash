import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
})
export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(72),
    confirmarSenha: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const registerSchema = z
  .object({
    nome: z.string().min(2, "Informe seu nome").max(100, "Nome muito longo"),
    email: z.string().min(1, "Informe o e-mail").email("E-mail inválido").max(100),
    senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(72),
    confirmarSenha: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
  })
export type RegisterInput = z.infer<typeof registerSchema>

export const transacaoSchema = z.object({
  valor: z.coerce.number().positive("Informe um valor maior que zero"),
  tipo: z.enum(["Entrada", "Saída"]),
  data_transacao: z.string().min(1, "Informe a data"),
  descricao: z.string().max(100, "Descrição muito longa").optional().or(z.literal("")),
  id_categoria: z.string().optional(), // "none" ou id em string (do select)
})
export type TransacaoInput = z.infer<typeof transacaoSchema>

export const categoriaSchema = z.object({
  nome_categoria: z.string().min(2, "Informe o nome").max(100, "Nome muito longo"),
  tipo_categoria: z.enum(["Receita", "Despesa"]),
})
export type CategoriaInput = z.infer<typeof categoriaSchema>

export const metaSchema = z.object({
  nome_meta: z.string().min(2, "Informe o nome da meta").max(100),
  valor_objetivo: z.coerce.number().positive("Informe um objetivo maior que zero"),
  data_limite: z.string().optional().or(z.literal("")),
})
export type MetaInput = z.infer<typeof metaSchema>

export const aporteSchema = z.object({
  valor: z.coerce.number().positive("Informe um valor maior que zero"),
})
export type AporteInput = z.infer<typeof aporteSchema>

export const perfilSchema = z.object({
  nome: z.string().min(2, "Informe seu nome").max(100, "Nome muito longo"),
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido").max(100),
})
export type PerfilInput = z.infer<typeof perfilSchema>

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual"),
    novaSenha: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres").max(72),
    confirmarNovaSenha: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.novaSenha === data.confirmarNovaSenha, {
    message: "As senhas não conferem",
    path: ["confirmarNovaSenha"],
  })
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>

export const preferenciasUsuarioSchema = z.object({
  tema_preferido: z.enum(["system", "light", "dark"]),
  ocultar_valores: z.boolean(),
})
export type PreferenciasUsuarioInput = z.infer<typeof preferenciasUsuarioSchema>

export const excluirContaSchema = z.object({
  confirmacao: z.literal("EXCLUIR", {
    error: "Digite EXCLUIR para confirmar.",
  }),
})
export type ExcluirContaInput = z.infer<typeof excluirContaSchema>
