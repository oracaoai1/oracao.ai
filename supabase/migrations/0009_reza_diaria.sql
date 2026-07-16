-- Reza Diária (streak): log auditável + agregado de leitura rápida, e a
-- função que atualiza os dois atomicamente. Ver
-- docs/superpowers/specs/2026-07-15-reza-diaria-streak-design.md

-- ============================================================================
-- daily_prayer_log — uma linha por dia concluído (auditável).
-- ============================================================================
create table if not exists public.daily_prayer_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  local_date    date not null,
  character_id  text not null,
  created_at    timestamptz not null default now(),
  unique (user_id, local_date)
);
alter table public.daily_prayer_log enable row level security;
create policy "Log pertence ao usuário"
  on public.daily_prayer_log for select using (auth.uid() = user_id);

-- ============================================================================
-- daily_prayer_streak — agregado de leitura rápida do estado atual.
-- ============================================================================
create table if not exists public.daily_prayer_streak (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  freezes_available integer not null default 1,
  last_local_date   date,
  updated_at        timestamptz not null default now()
);
alter table public.daily_prayer_streak enable row level security;
create policy "Streak pertence ao usuário"
  on public.daily_prayer_streak for select using (auth.uid() = user_id);

-- ============================================================================
-- Novo kind 'streak_milestone' no ledger de Velas (crédito de marco).
-- ============================================================================
alter table public.vela_transactions
  drop constraint if exists vela_transactions_kind_check;
alter table public.vela_transactions
  add constraint vela_transactions_kind_check check (kind in
    ('purchase', 'subscription_grant', 'engagement',
     'spend_image', 'spend_video', 'spend_live', 'spend_audio_loop',
     'streak_milestone', 'adjust', 'refund'));

-- ============================================================================
-- RPC complete_daily_prayer — débito atômico do streak do usuário logado.
-- ============================================================================
create or replace function public.complete_daily_prayer(
  p_local_date text,
  p_character_id text
)
returns table (
  current_streak integer,
  longest_streak integer,
  freezes_available integer,
  milestone_hit integer
)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_date date;
  v_row public.daily_prayer_streak;
  v_diff integer;
  v_week_last int;
  v_week_today int;
  v_milestone integer := null;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  v_date := p_local_date::date;

  if abs(v_date - (now() at time zone 'utc')::date) > 1 then
    raise exception 'invalid_local_date';
  end if;

  if exists (select 1 from public.daily_prayer_log
             where user_id = v_user and local_date = v_date) then
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
                 else v_date - v_row.last_local_date end;

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

  v_week_last := case when v_row.last_local_date is null then null
                      else extract(isoyear from v_row.last_local_date)::int * 100
                           + extract(week from v_row.last_local_date)::int end;
  v_week_today := extract(isoyear from v_date)::int * 100
                  + extract(week from v_date)::int;
  if v_week_last is null or v_week_today <> v_week_last then
    v_row.freezes_available := 1;
  end if;

  v_row.longest_streak := greatest(v_row.longest_streak, v_row.current_streak);
  v_row.last_local_date := v_date;

  insert into public.daily_prayer_log (user_id, local_date, character_id)
  values (v_user, v_date, p_character_id);

  update public.daily_prayer_streak set
    current_streak = v_row.current_streak,
    longest_streak = v_row.longest_streak,
    freezes_available = v_row.freezes_available,
    last_local_date = v_row.last_local_date,
    updated_at = now()
  where user_id = v_user;

  if v_row.current_streak in (7, 30, 100) then
    v_milestone := v_row.current_streak;
  end if;

  return query select v_row.current_streak, v_row.longest_streak,
                      v_row.freezes_available, v_milestone;
end;
$$;
revoke all on function public.complete_daily_prayer(text, text) from public, anon;
grant execute on function public.complete_daily_prayer(text, text) to authenticated;
