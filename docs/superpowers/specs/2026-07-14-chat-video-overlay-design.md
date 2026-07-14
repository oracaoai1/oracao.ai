# Chat com vídeo de fundo em loop + respostas mais curtas

Data: 2026-07-14
Status: aprovado para planejamento

## Resumo

Três mudanças no chat do oracao.ai:

1. Respostas da IA mais curtas (ajuste de prompt + teto de tokens).
2. Cada personagem (santo/anjo/devoção) ganha um vídeo de fundo em loop,
   silencioso, com movimento sutil e natural ("como se estivesse prestando
   atenção" em quem está conversando), gerado via Kling 2.6 Pro (fal.ai).
3. A interface do chat (cabeçalho, bolhas de mensagem, campo de digitar)
   passa a usar um tratamento de vidro fosco (fundo semi-transparente com
   desfoque) para ficar legível por cima do vídeo.

O item 1 é independente e vale para todos os personagens imediatamente. Os
itens 2 e 3 são acoplados (a UI translúcida só faz sentido quando há vídeo) e
têm rollout gradual: cada personagem usa a nova experiência assim que tiver
um vídeo aprovado; os demais continuam exatamente como hoje.

## Fora de escopo

- Não mexe na funcionalidade de "Cenas" (vídeos desbloqueáveis com Velas no
  `ScenesPanel`/`media_assets`) — é um sistema separado e continua como está.
- Não inclui geração de áudio/fala no vídeo de fundo (é mudo).
- Não inclui limpeza de linhas órfãs no Supabase referentes aos personagens
  removidos (ver "Catálogo de personagens" abaixo) — são inofensivas (sem FK).
- Não cobre atualização do vault do Obsidian (fonte de verdade de
  `data/santos.json`) além de deixar anotado que precisa ser sincronizado
  manualmente por quem mantém o vault.

## 1. Catálogo de personagens (pré-requisito)

`madre-paulina` e `joao-paulo-ii` não têm retrato em
`public/personagens/img-<id>.webp` hoje (usam avatar de iniciais), então não
dá para gerar vídeo image-to-video para eles. Decisão: remover os dois do
catálogo em vez de esperar por fotos.

Mudanças:
- `data/santos.json`: remover as duas entradas.
- `lib/voices.js`: remover as duas linhas de `VOICE_BY_ID`.
- `lib/characters.js`: remover as duas entradas de `EPITHETS` (os ids já não
  aparecem em `WITH_IMAGE`, então nenhuma outra mudança é necessária ali).
- `app/sitemap.js`: nenhuma mudança — é gerado a partir de `characters`, os
  dois ids somem sozinhos.
- Dados órfãos no Supabase (`conversations`, `favorites`, `generated_images`,
  `media_assets`, `voice_settings`, `user_unlocks` com esses `character_id`):
  ficam no banco sem problema (não há FK constraint — ver
  [[oracao-supabase-migracao]]); não é feita limpeza nesta mudança.

## 2. Geração dos vídeos de loop

### Por que Kling via fal.ai (não HeyGen)

HeyGen (já integrado, `lib/heygen.js`) gera vídeo de **avatar falando**,
guiado por um áudio/roteiro — não é a ferramenta certa para um loop
ambiente silencioso. Kling é um modelo geral de image-to-video, adequado
para "anime esta foto com movimento sutil". Está disponível no fal.ai, cuja
chave (`FAL_API_KEY`) o projeto já tem configurada — não precisa de conta ou
chave nova.

### Custo

Kling 2.6 Pro image-to-video: ~US$0,07–0,10/segundo (a taxa exata de I2V
pode incluir um acréscimo sobre o preço-base de text-to-video; confirmar no
primeiro teste). Para clipes de ~8s × 30 personagens: **estimativa de
US$17–24 no total**, cobrança única (gerado uma vez, reproduzido em loop
para sempre — não é custo recorrente por conversa, ao contrário do
chat/áudio/imagem no app). Rodar primeiro com 1–2 personagens
(`--only <id>`) para validar qualidade e custo real do fal.ai antes de
gerar os 30.

### Script: `scripts/generate-loop-videos.mjs`

Segue o padrão dos scripts existentes (`run-migration.mjs`,
`test-persistence.mjs`): script Node standalone, rodado manualmente pelo
operador (você), não uma rota de API nem uma tela de admin.

**Entrada:** lista de personagens de `lib/characters.js` (filtra os que têm
`image` != null, i.e. têm retrato).

**Flags:**
- `--only id1,id2` — gera apenas os ids informados (teste ou regeração
  pontual).
- Sem flags: gera para todos os personagens com retrato que ainda não têm
  vídeo aprovado (checagem simples: já existe um arquivo em
  `media/loops/<id>.mp4` no Storage? avisa e pula, a menos que `--force`).
- `--force` — regenera mesmo que já exista.

**Fluxo por personagem:**
1. Monta a URL pública do retrato:
   `https://www.oracao.ai/personagens/img-<id>.webp` (evita reimplementar
   upload de imagem — Kling recebe uma URL de imagem já pública).
2. Monta o prompt de movimento (template único, ver abaixo) inserindo o
   nome do personagem.
3. Chama a API de fila (queue) do fal.ai para o modelo
   `fal-ai/kling-video/v2.6/pro/image-to-video`, guarda o `request_id`.
4. Faz polling do status (mesmo padrão de espera usado em
   `getVideoStatus` do HeyGen) até `completed` ou erro/timeout.
5. Baixa o mp4 do resultado.
6. Sobe para o Supabase Storage: bucket `media`, caminho `loops/<id>.mp4`
   (usa `getSupabaseAdmin()`, mesmo client dos outros uploads do projeto).
7. Pega a URL pública (`storage.from('media').getPublicUrl(...)`).
8. Registra o resultado (sucesso + URL, ou erro) numa lista em memória.

**Saída:** ao final, imprime uma tabela no terminal (id, nome, status,
URL ou erro) para revisão manual. **Não mexe em `lib/characters.js`
sozinho** — depois de você assistir e aprovar cada vídeo, os ids aprovados
são adicionados ao `WITH_LOOP_VIDEO` (ver seção 3) numa mudança de código
separada, revisada como qualquer outra.

**Tratamento de erro:** falha em um personagem não interrompe os demais
(continua o loop, registra o erro na tabela final). Sem retry automático —
se um pedido falhar, roda de novo depois com `--only <id>`.

### Prompt de movimento (template único)

```
Portrait of {nome}, a Catholic saint/figure. Subtle, natural idle motion:
gentle breathing, slow occasional blinking, soft head tilt, warm and
attentive gaze toward the camera as if listening closely to someone
speaking. Serene, reverent, photorealistic. Soft golden devotional
lighting. Loopable motion, no text, no watermark, no camera movement.
```

Um único template parametrizado pelo nome — sem variação de "personalidade"
por personagem nesta primeira versão (poderia ser um ajuste futuro se algum
vídeo não combinar com o personagem).

## 3. Como o app sabe quais personagens têm vídeo

Sem tabela nova no Supabase — mesmo padrão já usado para as fotos
(`WITH_IMAGE`, em `lib/characters.js`):

```js
const WITH_LOOP_VIDEO = new Set([
  // preenchido incrementalmente conforme os vídeos são aprovados
]);
```

Em `normalize()`, adiciona:

```js
loopVideo: WITH_LOOP_VIDEO.has(s.id)
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/loops/${s.id}.mp4`
  : null,
```

(Formato padrão de URL pública do Supabase Storage — `<project_url>/storage/v1/object/public/<bucket>/<path>` — construído sem chamada de rede, igual ao que `storage.from(bucket).getPublicUrl(path)` devolveria. `NEXT_PUBLIC_SUPABASE_URL` já existe em `.env.local`/Vercel e está disponível tanto no servidor quanto no cliente.)

Isso já implementa o fallback pedido: personagem fora do `Set` →
`character.loopVideo` é `null` → `ChatRoom` renderiza exatamente como hoje,
sem nenhuma mudança visual. Nada de checagem em tempo de execução, nada de
loading state para saber se o vídeo existe — mantém `/chat/[id]` estático
(SSG), como já é hoje.

## 4. Mudanças em ChatRoom / CSS

### Vídeo de fundo

Em `app/chat/[id]/ChatRoom.js`, dentro de `.chat-page`, antes de tudo:

```jsx
{character.loopVideo && (
  <video
    className="chat-bg-video"
    src={character.loopVideo}
    autoPlay
    muted
    loop
    playsInline
    aria-hidden="true"
  />
)}
```

CSS (`app/globals.css`):

```css
.chat-bg-video {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}
```

Respeita `prefers-reduced-motion`: quando o usuário tiver essa preferência
ativada no sistema, o vídeo não recebe `autoplay` (via um pequeno check no
componente, não puramente CSS, já que `autoplay` é atributo HTML) — nesse
caso mostra o primeiro frame parado como "poster".

### Cabeçalho, mensagens e composer (vidro fosco)

Vale **apenas quando `character.loopVideo` existe** (nova classe
`.chat-page.has-bg-video` no elemento raiz, aplicada condicionalmente pelo
componente). Sem vídeo, os estilos atuais (fundo branco/claro) continuam
intocados.

```css
.chat-page.has-bg-video .chat-header,
.chat-page.has-bg-video .composer {
  background: rgba(15, 28, 51, 0.4);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border-color: rgba(255, 255, 255, 0.14);
}
.chat-page.has-bg-video .msg.assistant .bubble {
  background: rgba(255, 253, 248, 0.22);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  color: #fffdf8;
  border: 1px solid rgba(255, 255, 255, 0.22);
}
.chat-page.has-bg-video .msg.user .bubble {
  background: rgba(27, 42, 74, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.chat-page.has-bg-video .composer textarea,
.chat-page.has-bg-video .composer input {
  background: rgba(255, 253, 248, 0.85);
}
```

Cores/opacidades finais ajustadas durante a implementação olhando o vídeo
real (os valores acima refletem o mockup "opção A" aprovado, ponto de
partida, não números finais).

Mobile: mesmo vídeo, mesmo tratamento (decisão já tomada — sem alternativa
"imagem estática" para telas pequenas). `object-fit: cover` garante o
enquadramento em qualquer proporção de tela.

### Risco conhecido

O Kling pode gerar um vídeo cujo loop tenha um corte perceptível (não é
garantidamente contínuo/seamless). Não é tratado por código nesta v1 — se
acontecer, a correção é regenerar aquele personagem
(`--only <id> --force`) até o resultado ficar bom, antes de adicioná-lo ao
`WITH_LOOP_VIDEO`.

## 5. Respostas mais curtas (independente)

- `lib/characters.js`, `BASE_GUIDANCE`: troca "Respostas conversacionais
  (em geral 2 a 5 parágrafos curtos), nunca como um verbete." por algo como
  "Respostas curtas e diretas — em geral 1 a 2 parágrafos breves (poucas
  frases cada), como numa conversa real, nunca como um verbete."
- `app/api/chat/route.js`: `MAX_TOKENS` desce de `1024` para `~450` (teto
  de segurança; a instrução do prompt é o controle primário, o teto é
  backstop para o caso do modelo ignorar a instrução).
- Vale para todos os personagens, com ou sem vídeo de fundo, a partir do
  deploy.

## Testes / validação

- **Script de vídeo:** rodar com `--only` para 1–2 personagens primeiro;
  conferir no terminal que a tabela final mostra `completed` + URL válida;
  abrir a URL do Storage no navegador e confirmar que o vídeo reproduz e
  faz loop sem quebrar visualmente feio.
- **Fallback:** com `WITH_LOOP_VIDEO` vazio (estado inicial), abrir
  `/chat/<qualquer-id>` e confirmar que nada mudou visualmente.
- **Com vídeo:** depois de adicionar 1 id ao `WITH_LOOP_VIDEO`, abrir o
  chat desse personagem em desktop e mobile (preview local), conferir:
  vídeo autoplay silencioso em loop, texto das mensagens legível sobre o
  vídeo, campo de digitar utilizável, header com "Voltar"/avatar/nome/
  ações ainda visíveis e clicáveis.
- **`prefers-reduced-motion`:** simular a preferência no navegador (dev
  tools) e confirmar que o vídeo não entra em autoplay.
- **Respostas curtas:** enviar algumas mensagens de teste no chat local e
  conferir que as respostas ficam visivelmente mais breves que antes.

## Perguntas em aberto (assumidas, revisar se necessário)

- Duração exata do clipe (assumido ~8s) — ajustável durante a
  implementação sem impacto no design.
- Se algum vídeo ficar ruim mesmo após regenerar, decidir caso a caso
  (deixar aquele personagem sem vídeo, ou tentar outro prompt) — não é um
  bloqueio para os demais.
