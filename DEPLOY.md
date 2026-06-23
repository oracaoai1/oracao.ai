# Deploy do Oração.AI na Vercel

Guia para publicar o site em produção no domínio **oracao.ai**.

## Pré-requisitos

- Conta na [Vercel](https://vercel.com/) (gratuita serve para começar).
- Uma chave de API da Anthropic ([console.anthropic.com](https://console.anthropic.com/)).
- Um projeto no [Supabase](https://supabase.com/) com o esquema aplicado
  (ver [SUPABASE.md](SUPABASE.md)).
- O domínio `oracao.ai` (registrado em algum provedor — Registro.br, GoDaddy, etc.).

## Opção A — Deploy pelo painel da Vercel (recomendado)

1. **Suba o código para o GitHub** (se ainda não estiver):

   ```bash
   git remote add origin https://github.com/SEU_USUARIO/oracao-ai.git
   git push -u origin master
   ```

2. Em [vercel.com/new](https://vercel.com/new), clique em **Import Project** e
   selecione o repositório. A Vercel detecta o Next.js automaticamente — não
   precisa mudar nada nas configurações de build.

3. Em **Environment Variables**, adicione (os mesmos valores do seu
   `.env.local`, exceto o `SUPABASE_DB_URL`, que é só para migração local):

   | Nome                             | Onde obter                          |
   | -------------------------------- | ----------------------------------- |
   | `ANTHROPIC_API_KEY`              | console.anthropic.com               |
   | `NEXT_PUBLIC_SUPABASE_URL`       | Supabase → Project Settings → API   |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Supabase → Project Settings → API   |

   > O `service_role` só é necessário se/quando houver código de servidor que
   > precise ignorar a RLS — não é o caso hoje.

4. Clique em **Deploy**. Em ~1 min o site estará no ar num endereço
   `*.vercel.app`.

## Opção B — Deploy pela linha de comando

```bash
# uma única vez, para autenticar:
npx vercel login

# deploy de produção:
npx vercel --prod
```

Na primeira vez a CLI pergunta o escopo e o nome do projeto. Depois, configure
a variável de ambiente:

```bash
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

## Configurar o Supabase para produção

O login por e-mail e os links de confirmação só funcionam se o Supabase
conhecer o domínio de produção. No painel do Supabase → **Authentication →
URL Configuration**:

1. **Site URL**: `https://www.oracao.ai`
2. **Redirect URLs** (adicione todas):
   - `https://www.oracao.ai/auth/callback`
   - `https://oracao.ai/auth/callback`
   - `http://localhost:3000/auth/callback` (para desenvolvimento)

> O app usa `window.location.origin/auth/callback`, então funciona em qualquer
> domínio — mas o Supabase **rejeita** redirecionamentos que não estejam nesta
> lista. Sem isso, o link de confirmação de e-mail leva a um erro em produção.

## Conectar o domínio oracao.ai

1. No projeto da Vercel: **Settings → Domains → Add** e digite `oracao.ai`
   (adicione também `www.oracao.ai`).

2. A Vercel mostrará os registros DNS a configurar no seu provedor de domínio:

   - **Domínio raiz (`oracao.ai`)** → registro `A` apontando para `76.76.21.21`.
   - **`www.oracao.ai`** → registro `CNAME` apontando para `cname.vercel-dns.com`.

   > Se o seu provedor permitir, você pode em vez disso apontar os
   > **nameservers** para os da Vercel — ela gerencia tudo automaticamente.

3. O certificado HTTPS (SSL) é emitido pela Vercel automaticamente assim que o
   DNS propaga (pode levar de minutos a algumas horas).

## Checklist pós-deploy

- [ ] Variáveis `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` e
      `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas em produção.
- [ ] Supabase: **Site URL** e **Redirect URLs** com o domínio de produção.
- [ ] `oracao.ai` e `www.oracao.ai` apontando para a Vercel (DNS verde).
- [ ] Testar uma conversa real em produção.
- [ ] Testar cadastro/login e confirmar que o e-mail de confirmação abre o site.
- [ ] Definir um redirecionamento de `oracao.ai` → `www.oracao.ai` (ou
      vice-versa) em Settings → Domains.
