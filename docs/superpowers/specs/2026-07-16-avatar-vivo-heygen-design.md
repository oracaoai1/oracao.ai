# Avatar ao Vivo (HeyGen Streaming)

Data: 2026-07-16
Status: aprovado para planejamento

## Resumo

Nova seção na home (logo abaixo do hero) e uma página dedicada por
personagem, onde o usuário conversa em tempo real — por voz ou texto —
com um avatar falante em vídeo (HeyGen Streaming Avatar), usando o mesmo
"cérebro" (Claude + system prompt fiel) já usado no chat de texto. Recurso
premium: exige assinatura Médio ou Especial, cobrado a 2 Velas por minuto
completo de sessão.

Contexto já existente no projeto (achado na exploração, não precisa ser
criado):
- `HEYGEN_LIVEAVATAR_API_KEY` — chave separada da `HEYGEN_API_KEY` (usada
  hoje só para gerar vídeos em lote em `/admin/midia`).
- `HEYGEN_AVATAR_SAO_FRANCISCO`, `HEYGEN_AVATAR_NS_APARECIDA`,
  `HEYGEN_AVATAR_JESUS_CRISTO`, `HEYGEN_AVATAR_SANTA_TERESINHA` — ids de
  avatares interativos já criados no HeyGen para esses 4 personagens.
  **Só esses 4 personagens** têm avatar ao vivo nesta primeira versão.
- `lib/plans.js`: `TIERS.medio.liveAvatar = true`,
  `TIERS.especial.liveAvatar = true`, `TIERS.inicial.liveAvatar = false`,
  e `PRECOS.avatarVivoPorMinuto = 2` — já declarados, nunca consumidos em
  código até agora.
- `vela_transactions.kind` já aceita `'spend_live'` desde a migration
  0005 (nunca usado).

## Fora de escopo

- Novos avatares HeyGen além dos 4 já criados (criar avatar novo é uma
  tarefa separada, feita no painel do HeyGen, não neste código).
- Modo "Interactive Avatar" autônomo do próprio HeyGen (STT+LLM+TTS
  integrados) — decidido explicitamente que o avatar só fala texto já
  gerado pelo nosso Claude, para manter a fidelidade doutrinal do
  personagem.
- Gravar/salvar as conversas do avatar ao vivo no histórico de
  conversas do chat de texto (`conversations`/`messages`) — cada sessão
  ao vivo é efêmera, não persiste diálogo, só o registro de billing em
  `live_avatar_sessions`.

## 1. Modelo de dados

```sql
create table public.live_avatar_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  character_id       text not null,
  heygen_session_id  text,
  started_at         timestamptz not null default now(),
  ended_at           timestamptz,
  end_reason         text check (end_reason in
                      ('user_ended', 'time_limit', 'insufficient_velas', 'error')),
  minutes_billed     integer not null default 0
);
alter table public.live_avatar_sessions enable row level security;
create policy "Sessões pertencem ao usuário"
  on public.live_avatar_sessions for select using (auth.uid() = user_id);
```

Escrita só via service role (rotas de API abaixo, com `security definer`
implícito por usarem o client admin). Sem tabela nova para o débito de
Velas — reaproveita `spend_velas` (RPC já existente) com
`kind: 'spend_live'` e `reference: '<session_id>:<numero_do_minuto>'`
para garantir que o mesmo minuto nunca é cobrado duas vezes.

`lib/liveAvatar.js` (novo arquivo, mesmo padrão de `lib/voices.js`):

```js
const AVATAR_ID_BY_CHARACTER = {
  "sao-francisco": process.env.HEYGEN_AVATAR_SAO_FRANCISCO,
  "ns-aparecida": process.env.HEYGEN_AVATAR_NS_APARECIDA,
  "jesus-cristo": process.env.HEYGEN_AVATAR_JESUS_CRISTO,
  "santa-teresinha": process.env.HEYGEN_AVATAR_SANTA_TERESINHA,
};

export function hasLiveAvatar(characterId) {
  return !!AVATAR_ID_BY_CHARACTER[characterId];
}
export function getAvatarId(characterId) {
  return AVATAR_ID_BY_CHARACTER[characterId] || null;
}
```

## 2. Integração HeyGen (SDK oficial)

Pacote: `@heygen/liveavatar-web-sdk` (cliente) — SDK atual/suportado do
HeyGen para o produto "LiveAvatar" (o pacote antigo, `@heygen/streaming-avatar`,
está descontinuado e, na prática, quebrado — o build publicado nem inclui
os arquivos que o `package.json` declara como entrada). Confirmado por
inspeção dos tipos TypeScript do pacote novo + `docs.liveavatar.com`,
não só pela descrição geral.

**Fluxo:**
1. Backend (`/api/avatar-vivo/iniciar`) chama
   `POST https://api.liveavatar.com/v1/sessions/token`, header
   `X-API-KEY: <HEYGEN_LIVEAVATAR_API_KEY>` (nunca exposta ao navegador),
   body `{ mode: "LITE", avatar_id: <id do personagem>, max_session_duration: 900 }`
   (900s = 15 min, o próprio HeyGen também aplica esse teto como rede de
   segurança adicional à nossa). Resposta:
   `{ data: { session_id, session_token } }`.
2. Cliente instancia `new LiveAvatarSession(session_token, { voiceChat: true })`,
   chama `.start()` para conectar, e `.attach(videoElement)` para exibir o
   vídeo/áudio do avatar num `<video>` da página.
3. Para cada resposta do personagem, o cliente chama
   `session.repeat(texto)` — método do modo LITE que faz o avatar falar
   exatamente esse texto (lip-sync), sem gerar texto por conta própria
   (diferente de `.message()`, que é para o modo FULL/agente autônomo,
   fora de escopo aqui).
4. `session.stop()` encerra a conexão.

**Áudio/voz**: o próprio avatar HeyGen já tem uma voz configurada (definida
quando o avatar foi criado no painel do HeyGen/LiveAvatar). Não usa
ElevenLabs nem `lib/voices.js` aqui.

**Entrada por voz do usuário**: `voiceChat: true` habilita a escuta do
microfone pelo próprio SDK (`session.startListening()`/`stopListening()`),
mas como decidimos manter nosso próprio Claude como cérebro, a transcrição
de voz do usuário continua vindo do `MicButton`/Web Speech API já
existente no projeto (texto transcrito vai para `/api/avatar-vivo/falar`
igual à entrada por texto) — `voiceChat` fica ligado só para a
infraestrutura de áudio do SDK funcionar corretamente, não para o HeyGen
decidir sozinho o que o avatar responde.

## 3. Rotas de API

- **`POST /api/avatar-vivo/iniciar`** — body `{ characterId }`.
  - 401 se não logado.
  - 403 se `characterId` não tem avatar configurado (`hasLiveAvatar`
    falso) ou se a assinatura ativa do usuário não tem `liveAvatar: true`
    (via `getActiveSubscription` + `TIERS[tier].liveAvatar`).
  - 402 se saldo de Velas < `PRECOS.avatarVivoPorMinuto` (custo do 1º
    minuto, verificado antes de gastar qualquer coisa com o HeyGen).
  - Cria a linha em `live_avatar_sessions`, chama
    `streaming.create_token`, retorna
    `{ sessionId, heygenToken, avatarId }`.
- **`POST /api/avatar-vivo/tick`** — body `{ sessionId }`, chamada pelo
  cliente a cada 60s de sessão ativa (via `setInterval`).
  - Confere que a sessão pertence ao usuário logado e `ended_at` é nulo.
  - Se `now() - started_at > 15 min`: marca `ended_at`/`end_reason =
    'time_limit'`, retorna `{ ended: true, reason: 'time_limit' }`.
  - Senão, chama `spend_velas(2, 'spend_live', '<sessionId>:<minuto>')`.
    Se `false` (saldo insuficiente): marca `ended_at`/`end_reason =
    'insufficient_velas'`, retorna `{ ended: true, reason:
    'insufficient_velas' }`. Se `true`: incrementa `minutes_billed`,
    retorna `{ ended: false }`.
- **`POST /api/avatar-vivo/encerrar`** — body `{ sessionId, reason }`
  (`reason` = `'user_ended'` no botão manual, `'error'` em desconexão
  inesperada). Marca `ended_at`/`end_reason` se ainda não estava
  encerrada (idempotente). Chamada também via `navigator.sendBeacon` no
  evento `beforeunload`.
- **`POST /api/avatar-vivo/falar`** — body
  `{ sessionId, characterId, messages }`. Confere que a sessão está ativa
  e pertence ao usuário, roda a MESMA lógica de `/api/chat` (mesmo
  `buildSystemPrompt` fiel do personagem) para gerar a resposta em texto,
  devolve `{ reply }`. Não persiste em `conversations`/`messages` (sessão
  ao vivo é efêmera).

## 4. Página `/avatar-vivo/[id]` e seção na home

**Seção na home** (`app/page.js`, logo após o `.hero`): grade com os 4
personagens que têm `hasLiveAvatar(id)` verdadeiro. Cada card mostra
nome/imagem do personagem; sem assinatura Médio/Especial ativa, mostra um
selo "Recurso Premium" e leva para `/assinar` ao clicar; com assinatura
ativa, leva para `/avatar-vivo/<id>`.

**Página `/avatar-vivo/[id]`** (client component, layout tipo
videochamada):
- Sem assinatura no tier certo: mostra só aviso + CTA `/assinar`, sem
  carregar o SDK nem chamar qualquer rota do HeyGen.
- Com assinatura: botão "Iniciar conversa" → chama `/api/avatar-vivo/iniciar`,
  conecta o SDK (`<video>` recebendo o `MediaStream`), inicia o
  `setInterval` de 60s chamando `/tick`.
- Entrada do usuário: campo de texto **e** `MicButton` (Web Speech API,
  componente já existente) — usuário escolhe. Transcrição/texto digitado
  vai para `/api/avatar-vivo/falar`; a resposta recebida dispara
  `avatar.speak()`.
- Indicadores visíveis: minutos decorridos, estimativa de Velas
  restantes, aviso ao se aproximar dos 15 min.
- Botão "Encerrar" chama `/api/avatar-vivo/encerrar` com
  `reason: 'user_ended'` e desconecta o SDK. `window.addEventListener('beforeunload', ...)`
  com `navigator.sendBeacon` cobre fechar a aba sem clicar em encerrar.
- Se `/tick` retornar `ended: true`: mostra o motivo (`time_limit` ou
  `insufficient_velas`) e desconecta o SDK automaticamente.

## 5. Erros e casos de borda

- Sem login / sem assinatura no tier certo / personagem sem avatar
  configurado → `/iniciar` responde 401/403 antes de qualquer chamada ao
  HeyGen (custo zero).
- Saldo insuficiente já no início → bloqueia antes de criar sessão/token,
  com link para `/assinar` ou comprar Velas avulsas.
- Falha do HeyGen ao criar token/sessão → erro amigável ao usuário,
  nenhuma Vela debitada (débito só ocorre no `/tick`, após conexão bem-
  sucedida).
- Conexão cai no meio (rede instável) → evento de desconexão do SDK
  dispara chamada a `/encerrar` com `reason: 'error'`, para o timer local.
- Aba fechada sem clicar em "Encerrar" → `sendBeacon` tenta registrar;
  mesmo se falhar, a sessão simplesmente para de receber `/tick` (que
  depende do cliente ativo), então não é cobrada indefinidamente — no
  pior caso, cobra só até o último minuto que rodou antes de fechar.
- Duplo `/tick` pro mesmo minuto (ex.: retry de rede) → idempotente pelo
  `reference` único em `spend_velas`, mesmo padrão já usado em outras
  features (streak, repetição de oração).

## 6. Testes / validação

- Usuário sem assinatura Médio/Especial: página mostra aviso, SDK não
  carrega, nenhuma rota do HeyGen é chamada.
- Início de sessão: token criado, `<video>` conecta e mostra o avatar.
- Pergunta por texto e por voz: ambas chegam em `/api/avatar-vivo/falar`
  e disparam `avatar.speak()` com a resposta do Claude.
- Tick de minuto: debita 2 Velas por minuto completo; saldo insuficiente
  encerra a sessão automaticamente com o motivo certo.
- Limite de 15 minutos: encerra mesmo com saldo de Velas sobrando.
- Encerrar manualmente e fechar a aba sem encerrar: nos dois casos,
  `live_avatar_sessions` termina com `ended_at`/`end_reason` preenchidos.

## Perguntas em aberto (assumidas, revisar se necessário)

- Nenhuma — todas as decisões de produto (motor de resposta, entrada do
  usuário, local da experiência, cobrança por minuto, controle de
  acesso, limite de sessão) foram confirmadas durante o brainstorming.
