# Supabase — configuração

A migração do Base44 usa o Supabase para **autenticação, histórico de
conversas, favoritos e intenções de oração**. O catálogo de personagens
**continua em `data/santos.json`** (fonte de verdade curada no Obsidian) —
as tabelas referenciam o personagem pelo `id` textual, sem chave estrangeira.

## 1. Criar o projeto

1. Acesse https://supabase.com/dashboard e crie um novo projeto.
2. Escolha uma região próxima (ex.: South America / São Paulo) e uma senha
   forte para o banco.
3. Em **Project Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (secreta, só no servidor)
4. Cole esses valores em `.env.local` (já existem os campos vazios).

## 2. Aplicar o esquema

Abra **SQL Editor** no painel do Supabase, cole o conteúdo de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) e
execute. Isso cria as tabelas `profiles`, `conversations`, `messages`,
`favorites` e `prayer_intentions`, todas com Row Level Security (cada usuário
só acessa os próprios dados) e o gatilho que cria um perfil a cada cadastro.

> Alternativa com a CLI: instale a [Supabase CLI](https://supabase.com/docs/guides/cli),
> rode `supabase link --project-ref <ref>` e depois `supabase db push`.

## 3. Autenticação

Em **Authentication → Providers**, habilite **Email** (e os provedores OAuth
desejados, ex.: Google). Para desenvolvimento, é prático desativar a
confirmação por e-mail em **Authentication → Sign In / Providers → Email**.

## Como o código se conecta

| Onde | Arquivo | Uso |
| --- | --- | --- |
| Navegador (Client Components) | `lib/supabase/client.js` | `createClient()` |
| Servidor (Server Components, Route Handlers) | `lib/supabase/server.js` | `await createClient()` |
| Sessão por requisição | `middleware.js` + `lib/supabase/middleware.js` | renova o token |

Sem credenciais no `.env.local`, o middleware não tenta abrir sessão e o app
roda normalmente — útil enquanto o projeto Supabase ainda não existe.

## Próximos passos (ainda não implementados)

- Telas de login/cadastro e callback de OAuth.
- Persistir mensagens em `conversations`/`messages` a partir do `/api/chat`.
- UI de favoritos e intenções de oração.
