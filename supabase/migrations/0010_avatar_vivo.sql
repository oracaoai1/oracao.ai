-- Avatar ao Vivo (HeyGen Streaming): registro de sessões para billing por
-- minuto e auditoria. O débito em si usa o spend_velas já existente (kind
-- 'spend_live', já permitido desde a migration 0005). Ver
-- docs/superpowers/specs/2026-07-16-avatar-vivo-heygen-design.md

create table if not exists public.live_avatar_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  character_id       text not null,
  heygen_session_id  text,
  started_at         timestamptz not null default now(),
  ended_at           timestamptz,
  end_reason         text check (end_reason in
                      ('user_ended', 'time_limit', 'insufficient_velas', 'error')),
  minutes_billed     integer not null default 0
);
create index if not exists live_avatar_sessions_user_idx
  on public.live_avatar_sessions (user_id, started_at desc);
alter table public.live_avatar_sessions enable row level security;
create policy "Sessões pertencem ao usuário"
  on public.live_avatar_sessions for select using (auth.uid() = user_id);
