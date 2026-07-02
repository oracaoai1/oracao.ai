-- Configuração de voz por personagem (ajustável no Estúdio de Vozes /admin).
-- character_id = id do santo, ou '__default__' para o padrão global.
-- Acesso somente via service_role (rotas admin no servidor); sem políticas
-- públicas — a RLS fica ligada e bloqueia anon/authenticated.
create table if not exists public.voice_settings (
  character_id     text primary key,
  voice_id         text,
  stability        real not null default 0.75,
  similarity_boost real not null default 0.80,
  style            real not null default 0.20,
  speed            real not null default 1.0,
  updated_at       timestamptz not null default now()
);

alter table public.voice_settings enable row level security;
