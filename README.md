# Oração.AI

Plataforma de personagens de inteligência artificial que recriam **figuras históricas da Igreja Católica** — santos, papas, místicos e doutores — para conversas educativas e espirituais.

Site: [www.oracao.ai](https://www.oracao.ai)

## Tecnologia

- [Next.js 15](https://nextjs.org/) (App Router) + React 19
- API da Anthropic ([Claude](https://www.anthropic.com/)) para as conversas
- CSS próprio (sem dependências de UI)

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure a chave da API. Copie `.env.example` para `.env.local` e preencha:

   ```bash
   cp .env.example .env.local
   ```

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   A chave é obtida no [Console da Anthropic](https://console.anthropic.com/).

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

```
app/
  page.js                 Página inicial (hero + galeria + como funciona)
  sobre/page.js           Página "Sobre"
  chat/[id]/page.js       Resolve o personagem
  chat/[id]/ChatRoom.js   Interface de conversa (client)
  api/chat/route.js       Endpoint que chama a API do Claude
  components/             Barra de navegação, rodapé, cartão de personagem
lib/
  characters.js           Catálogo de personagens + system prompts
```

## Adicionar um novo personagem

Basta acrescentar um objeto ao array em [`lib/characters.js`](lib/characters.js).
O `id` vira a URL (`/chat/<id>`) e o `systemPrompt` define como o personagem
responde. Nenhum outro arquivo precisa ser alterado.

## Aviso

As respostas são geradas por IA e representam uma recriação respeitosa, não as
pessoas reais. Não substituem o magistério da Igreja, as Escrituras nem o
acompanhamento de um sacerdote ou diretor espiritual.
