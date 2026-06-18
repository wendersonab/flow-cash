# FlowCash

**Controle seu dinheiro. Realize seus objetivos.**

FlowCash é um sistema de controle financeiro pessoal com login/cadastro, dashboard,
controle de movimentações, categorias, metas financeiras e relatórios.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + Lucide React
- Recharts (gráficos responsivos)
- Zod + React Hook Form (validação de formulários)
- Supabase JS + @supabase/ssr (acesso ao banco e autenticação)
- next-themes (dark/light)
- Autenticação nativa do **Supabase Auth** (e-mail + senha, sessão em cookies)

## Banco de dados

A aplicação usa um banco no Supabase com as tabelas `endereco`, `usuario`,
`categoria`, `transacao` e `meta_financeira`.

A senha é gerenciada **exclusivamente pelo Supabase Auth** (`auth.users`).
A tabela `usuario` funciona como perfil complementar: cada conta autenticada é
mapeada para a linha de `usuario` correspondente pelo **e-mail**, fornecendo o
`id_usuario` inteiro usado por `categoria`, `transacao` e `meta_financeira`.
A coluna `usuario.senha_hash` recebe um valor fixo de compatibilidade.

> Convenção de valores em `transacao`: **valores positivos = Entrada/Receita**,
> **valores negativos = Saída/Despesa**.

## Configuração local

1. Copie `.env.example` para `.env.local` e preencha:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=        # URL do seu projeto Supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Chave anon pública
   NEXT_PUBLIC_SITE_URL=            # Em produção: https://seu-site.vercel.app
   ```

   Em desenvolvimento local, `NEXT_PUBLIC_SITE_URL` pode ficar vazio.
   Em produção na Vercel, defina `NEXT_PUBLIC_SITE_URL` com a URL real publicada.

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Rode o projeto:

   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:3000` — você será redirecionado para `/login`.

## Fluxo de confirmação de e-mail

O cadastro usa o Supabase Auth. Quando a confirmação de e-mail estiver ativa:

1. O usuário cria a conta.
2. O Supabase envia o link de confirmação.
3. O link abre `/auth/callback`.
4. O callback troca o código por sessão, garante/cria o perfil em `usuario` e
   redireciona para `/auth/verified`.
5. A tela `/auth/verified` informa que a conta foi verificada com sucesso e
   oferece o botão para entrar no dashboard.

## Configuração obrigatória no Supabase Auth

No Supabase, vá em **Authentication > URL Configuration**.

Configure a **Site URL** de produção:

```txt
https://seu-site.vercel.app
```

Em **Redirect URLs**, adicione pelo menos:

```txt
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=/reset-password
https://seu-site.vercel.app/auth/callback
https://seu-site.vercel.app/auth/callback?next=/reset-password
```

Troque `https://seu-site.vercel.app` pelo domínio real do projeto na Vercel.
Se usar domínio próprio, adicione também as mesmas rotas com o domínio próprio.

## Como trocar o símbolo da marca e o favicon

A pasta da marca fica em:

```txt
src/assets/brand/
```

Substitua os arquivos mantendo exatamente estes nomes:

```txt
src/assets/brand/icon.png
src/assets/brand/icon.ico
```

O arquivo `icon.png` é usado apenas como símbolo ao lado do texto "FlowCash".
O texto do logo continua como texto real no componente `Logo`, então ele acompanha
cor, tema claro/escuro e responsividade do site.

Depois rode:

```bash
npm run dev
```

ou, para produção:

```bash
npm run build
```

Antes de iniciar o Next, o script `scripts/sync-brand-assets.mjs` copia os assets
para `public/`, deixando o favicon disponível em `/icon.ico`.

## Rotas

- `/login` — pública (login + cadastro + solicitação de recuperação de senha)
- `/auth/callback` — callback do Supabase Auth
- `/auth/verified` — tela de conta verificada com sucesso
- `/reset-password` — pública via link do Supabase para cadastrar nova senha
- `/dashboard` — resumo, gráficos e últimas transações
- `/movimentacoes` — CRUD de transações com filtros e paginação
- `/categorias` — CRUD de categorias
- `/metas` — CRUD de metas + aportes
- `/relatorios` — relatórios por período

## Row Level Security (RLS) — importante

A aplicação acessa as tabelas com a **chave anon** do Supabase. Se o RLS estiver
**ativado** em `usuario` ou `categoria` **sem políticas adequadas**, o login
falhará na etapa de criar/ler o perfil com erros como
`new row violates row-level security policy` ou `permission denied`.

Em **desenvolvimento** (`NODE_ENV=development`), a tela de login mostra a mensagem
real do Supabase abaixo do erro amigável (prefixo `[debug]`), e o servidor loga
`[v0] Erro ao buscar perfil` / `[v0] Erro ao criar perfil` com o detalhe completo.

A ligação entre o Supabase Auth e a tabela `usuario` é feita **sempre por e-mail**.
Nunca por UUID, `id`, `user_id`, `auth_id` nem pela tabela `profiles`.
