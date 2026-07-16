# Reza Diária (streak de oração)

Data: 2026-07-15
Status: aprovado para planejamento

## Resumo

Primeira de uma família de features inspiradas no Hallow.com para manter o
usuário voltando ao oracao.ai ("novena", "reza diária", "outras funções" —
tratadas como sub-projetos independentes). Esta spec cobre só a **reza
diária / streak**: um hábito central de "marquei que rezei hoje", com
contador de dias seguidos, um "santo do dia" e pequenas recompensas em
Velas nos marcos.

## Fora de escopo

- Novena (sequência guiada de N dias por uma intenção específica) — spec
  separada, decidido depois desta.
- Notificações/lembretes push ou por e-mail — não existe infraestrutura de
  push nem de e-mail transacional custom hoje (só templates de auth do
  Supabase via SMTP da Epik); fica como ideia futura, não faz parte desta
  entrega.
- Qualquer outra função "estilo Hallow" não nomeada (exame de consciência,
  terço guiado, leituras diárias) — tratar como sub-projetos futuros.

## 1. Modelo de dados (Supabase)

```sql
-- Log: uma linha por dia concluído (auditável).
create table public.daily_prayer_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  local_date    date not null,        -- data LOCAL do usuário, não UTC
  character_id  text not null,        -- santo do dia mostrado nessa conclusão
  created_at    timestamptz not null default now(),
  unique (user_id, local_date)        -- no máximo 1 conclusão por dia
);
alter table public.daily_prayer_log enable row level security;
create policy "Log pertence ao usuário"
  on public.daily_prayer_log for select using (auth.uid() = user_id);

-- Agregado: leitura rápida do estado atual do streak.
create table public.daily_prayer_streak (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  freezes_available integer not null default 1,   -- "perdão" da semana (0 ou 1)
  last_local_date   date,                          -- último dia concluído
  updated_at        timestamptz not null default now()
);
alter table public.daily_prayer_streak enable row level security;
create policy "Streak pertence ao usuário"
  on public.daily_prayer_streak for select using (auth.uid() = user_id);
```

Ambas seguem o padrão já usado em `vela_balances`/`vela_transactions`
(agregado de leitura rápida + log auditável), com RLS restringindo a leitura
ao próprio dono; escrita só via a função RPC abaixo (`security definer`).

**Marcos de Velas** (créditos únicos, não uma tabela — mapeados no código):

```js
export const STREAK_MILESTONES = { 7: 3, 30: 10, 100: 30 };
```

Creditados via `grant_velas` já existente, com `kind: 'streak_milestone'` e
`reference: '<user_id>:<marco>'` — a unique index já existente em
`vela_transactions` (`kind + reference` para kinds de crédito) garante que
cada marco só credita uma vez por usuário, sem precisar de coluna nova.

## 2. RPC `complete_daily_prayer`

```sql
create or replace function public.complete_daily_prayer(
  p_local_date date,
  p_character_id text
)
returns table (
  current_streak integer,
  longest_streak integer,
  freezes_available integer,
  milestone_hit integer  -- 7, 30, 100 ou null
)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.daily_prayer_streak;
  v_diff integer;
  v_week_last int;
  v_week_today int;
  v_milestone integer := null;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  -- Guarda-chuva simples: local_date não pode se afastar mais de 1 dia da
  -- data UTC do servidor (evita manipular relógio do aparelho pra pular
  -- streak à vontade; não é crítico, é gamificação).
  if abs(p_local_date - (now() at time zone 'utc')::date) > 1 then
    raise exception 'invalid_local_date';
  end if;

  -- Idempotente: já concluiu esse dia? retorna estado atual sem mudar nada.
  if exists (select 1 from public.daily_prayer_log
             where user_id = v_user and local_date = p_local_date) then
    select * into v_row from public.daily_prayer_streak where user_id = v_user;
    return query select v_row.current_streak, v_row.longest_streak,
                        v_row.freezes_available, null::integer;
    return;
  end if;

  select * into v_row from public.daily_prayer_streak where user_id = v_user;
  if not found then
    insert into public.daily_prayer_streak (user_id) values (v_user)
    returning * into v_row;
  end if;

  v_diff := case when v_row.last_local_date is null then null
                 else p_local_date - v_row.last_local_date end;

  if v_diff is null then
    v_row.current_streak := 1;
  elsif v_diff = 1 then
    v_row.current_streak := v_row.current_streak + 1;
  elsif v_diff = 2 and v_row.freezes_available > 0 then
    v_row.freezes_available := v_row.freezes_available - 1;
    v_row.current_streak := v_row.current_streak + 1;
  else
    v_row.current_streak := 1;
  end if;

  -- Perdão semanal: nova semana ISO desde a última atividade -> volta ao teto (1).
  v_week_last := case when v_row.last_local_date is null then null
                      else extract(week from v_row.last_local_date)::int
                           + extract(isoyear from v_row.last_local_date)::int * 100 end;
  v_week_today := extract(week from p_local_date)::int
                  + extract(isoyear from p_local_date)::int * 100;
  if v_week_last is null or v_week_today <> v_week_last then
    v_row.freezes_available := 1;
  end if;

  v_row.longest_streak := greatest(v_row.longest_streak, v_row.current_streak);
  v_row.last_local_date := p_local_date;

  insert into public.daily_prayer_log (user_id, local_date, character_id)
  values (v_user, p_local_date, p_character_id);

  update public.daily_prayer_streak set
    current_streak = v_row.current_streak,
    longest_streak = v_row.longest_streak,
    freezes_available = v_row.freezes_available,
    last_local_date = v_row.last_local_date,
    updated_at = now()
  where user_id = v_user;

  -- Marco batido pela primeira vez? credita Velas (idempotente pelo reference).
  if v_row.current_streak in (7, 30, 100) then
    v_milestone := v_row.current_streak;
  end if;

  return query select v_row.current_streak, v_row.longest_streak,
                      v_row.freezes_available, v_milestone;
end;
$$;
revoke all on function public.complete_daily_prayer(date, text) from public, anon;
grant execute on function public.complete_daily_prayer(date, text) to authenticated;
```

O crédito de Velas do marco (`grant_velas`) é chamado pela **rota de API**
(não dentro da RPC acima, que já é `security definer` mas não tem acesso à
lógica de `grant_velas` sem duplicar código) — ver seção 4. Se esse crédito
falhar, o streak em si já foi salvo com sucesso; logamos o erro e seguimos
(Velas é bônus, não deve travar a conclusão do dia).

## 3. Escolha do "santo do dia"

Função pura em `lib/dailyPrayer.js`, sem estado no banco:

1. A partir da `local_date` (string `YYYY-MM-DD` vinda do cliente), extrai
   `MM-DD`.
2. Um mapa `FEAST_BY_DATE` (`"MM-DD" -> characterId[]`), construído uma vez
   fazendo parse do campo `feast` de cada personagem (texto livre tipo
   `"28 de agosto"`, `"1º de outubro"` — regex com mapa de nomes de mês em
   português, tratando `"1º"` como dia 1). Personagens sem `feast` parseável
   (`sao-francisco`, `jesus-cristo`) ficam fora do mapa, mas continuam
   participando do rodízio geral (passo 3).
3. Se `MM-DD` bate com uma ou mais entradas do mapa, escolhe
   deterministicamente pelo dia do ano (`dayOfYear % candidatos.length`) —
   nunca aleatório, mesmo santo o dia inteiro.
4. Se não bate nenhuma, cai no rodízio geral:
   `characters[dayOfYear % characters.length]` (ordem estável = ordem de
   `data/santos.json`).
5. **Frase do dia**: dentro de `frases_assinatura` do personagem escolhido,
   pega `frases[dayOfYear % frases.length]` — também determinístico (não
   muda a cada reload do dia).

## 4. Rotas de API

- **`GET /api/oracao-do-dia?localDate=YYYY-MM-DD`**
  - Sem login: retorna só o santo do dia + frase (sem streak).
  - Logado: retorna também `{ currentStreak, longestStreak, freezesAvailable, completedToday }` (consulta `daily_prayer_streak` e `daily_prayer_log`).
- **`POST /api/oracao-do-dia/concluir`** — body `{ localDate, characterId }`.
  - 401 se não logado.
  - 400 se `localDate` ausente/mal formatada.
  - Chama a RPC `complete_daily_prayer`. Se `milestone_hit` vier preenchido,
    chama `grant_velas` (service role) com
    `kind: 'streak_milestone'`, `reference: '<user_id>:<milestone>'`,
    `amount: STREAK_MILESTONES[milestone]`.
  - Resposta: `{ currentStreak, longestStreak, freezesAvailable, velasGanhas }`.

Precisa de uma migration nova (`supabase/migrations/0009_...sql`) com o SQL
da seção 1 e 2, mais o novo `kind` `'streak_milestone'` na check constraint
de `vela_transactions.kind` (mesmo padrão da migration 0008).

## 5. Página `/oracao-do-dia`

Server component (busca o santo do dia + estado do streak do usuário
logado via `createClient()` do servidor), com um client component para o
botão de concluir (precisa saber a data local do navegador, que o servidor
não tem).

- **Anônimo**: mostra o santo do dia + frase + áudio, sem streak; CTA
  "Entre para acompanhar sua sequência" no lugar do botão de concluir.
- **Logado**:
  - Cabeçalho: "🔥 N dias seguidos", recorde pessoal, indicador se o
    perdão da semana está disponível.
  - Cartão do santo do dia: imagem, nome, frase de assinatura,
    `AudioPlayerWrapper` (reaproveitado, sem `loopReference` — não precisa
    de repetição paga aqui).
  - Botão "Marcar oração de hoje" → `POST /api/oracao-do-dia/concluir` com
    a data local do `Date` do navegador. Sucesso vira "✓ Concluída hoje"
    (desabilitado). Se `completedToday` já vier `true` do `GET` inicial,
    já carrega nesse estado.
  - Se `velasGanhas > 0` na resposta do POST, mostra uma mensagem
    comemorativa ("🕯️ +N Velas por N dias seguidos!").
- Link novo no `TopBar` (`app/components/SiteChrome.js`), ao lado de
  "Personagens"/"Biblioteca".

## 6. Erros e casos de borda

- Sem login → página mostra CTA de entrar; `POST` retorna 401.
- `local_date` implausível (relógio do aparelho manipulado) → RPC lança
  `invalid_local_date`; API responde com erro amigável ("Não foi possível
  registrar a data. Verifique o relógio do seu aparelho.").
- Personagem do dia sem `frases_assinatura` (não deve acontecer, mas por
  garantia) → cai num texto genérico de fallback fixo em vez de quebrar a
  página.
- Falha ao creditar Velas do marco (`grant_velas` lança erro) → logamos o
  erro no servidor mas NÃO revertemos nem bloqueamos a conclusão do streak
  já salva; a resposta ao cliente reporta `velasGanhas: 0` nesse caso.
- Duplo clique / requisição repetida no mesmo dia → RPC é idempotente
  (early return sem alterar nada), então não incrementa nem credita Velas
  duas vezes.

## 7. Testes / validação

- Primeira conclusão: `current_streak` vira 1, sem marco.
- Conclusões em `local_date` consecutivas: incrementa normalmente.
- Pular exatamente 1 dia com `freezes_available = 1`: streak continua
  (consome o perdão), `freezes_available` vira 0.
- Pular exatamente 1 dia com `freezes_available = 0`: reseta pra 1.
- Pular 2+ dias (com ou sem perdão disponível): sempre reseta pra 1.
- Perdão semanal: `freezes_available` volta a 1 ao cruzar pra uma nova
  semana ISO desde a última atividade, mesmo sem ter sido consumido.
- Bater os marcos 7/30/100 (simulando avanço de `local_date` via chamadas
  diretas à RPC/API, não esperando dias reais): credita Velas exatamente
  uma vez cada.
- Duplo clique no mesmo dia: não incrementa streak nem credita Velas de
  novo.
- Anônimo: página carrega o santo do dia normalmente, sem erro, com CTA de
  login no lugar do botão.

## Perguntas em aberto (assumidas, revisar se necessário)

- Nenhuma — todas as decisões de produto (o que conta como "rezar hoje",
  origem do conteúdo, regra de perdão, recompensa, localização da página)
  foram confirmadas durante o brainstorming.
