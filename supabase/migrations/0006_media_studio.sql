-- Estúdio de Mídia: roteiro e id de renderização por cena; cache de
-- talking photos do HeyGen por personagem (evita re-upload da foto).
alter table public.media_assets add column if not exists script text;
alter table public.media_assets add column if not exists heygen_video_id text;

create table if not exists public.heygen_photos (
  character_id     text primary key,
  talking_photo_id text not null,
  created_at       timestamptz not null default now()
);
-- Sem policies: acesso apenas via service role (rotas admin).
alter table public.heygen_photos enable row level security;
