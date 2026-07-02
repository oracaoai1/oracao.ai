-- Contadores de uso diário por usuário (rate limiting em serverless).
-- Fundação do free tier: limites configuráveis por rota via env.
create table if not exists public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind    text not null check (kind in ('chat', 'audio')),
  day     date not null default (now() at time zone 'utc')::date,
  count   integer not null default 0,
  primary key (user_id, kind, day)
);

alter table public.usage_counters enable row level security;

create policy "Usuário vê os próprios contadores"
  on public.usage_counters for select
  using (auth.uid() = user_id);

-- Incremento atômico com verificação de limite.
-- Retorna true se a requisição está dentro do limite (e incrementa);
-- false se o limite diário já foi atingido (não incrementa).
create or replace function public.increment_usage(p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer;
begin
  if (v_user is null) then
    return false;
  end if;

  insert into public.usage_counters (user_id, kind, day, count)
  values (v_user, p_kind, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, kind, day)
  do update set count = usage_counters.count + 1
  where usage_counters.count < p_limit
  returning count into v_count;

  return v_count is not null;
end;
$$;

-- Apenas usuários autenticados podem consumir cota.
revoke all on function public.increment_usage(text, integer) from public, anon;
grant execute on function public.increment_usage(text, integer) to authenticated;
