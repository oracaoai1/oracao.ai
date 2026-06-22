# Deploy do Oração.AI na Vercel

Guia para publicar o site em produção no domínio **oracao.ai**.

## Pré-requisitos

- Conta na [Vercel](https://vercel.com/) (gratuita serve para começar).
- Uma chave de API da Anthropic ([console.anthropic.com](https://console.anthropic.com/)).
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

3. Em **Environment Variables**, adicione:

   | Nome                | Valor          |
   | ------------------- | -------------- |
   | `ANTHROPIC_API_KEY` | `sk-ant-...`   |

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
```

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

- [ ] Variável `ANTHROPIC_API_KEY` configurada em produção.
- [ ] `oracao.ai` e `www.oracao.ai` apontando para a Vercel (DNS verde).
- [ ] Testar uma conversa real em produção.
- [ ] Definir um redirecionamento de `oracao.ai` → `www.oracao.ai` (ou
      vice-versa) em Settings → Domains.
