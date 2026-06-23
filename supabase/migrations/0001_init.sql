-- Oração.AI — esquema inicial (migração do Base44 para Supabase).
--
-- Escopo: autenticação (auth.users, gerido pelo Supabase), perfis, histórico
-- de conversas, favoritos e intenções de oração por usuário.
--
-- NÃO inclui o catálogo de personagens: a fonte de verdade continua sendo
-- data/santos.json (curado no Obsidian). As tabelas referenciam o personagem
-- pelo seu "id" textual (ex.: "sao-francisco"), sem chave estrangeira.

-- ============================================================================
-- profiles — dados públicos do usuário, espelham auth.users 1:1.
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Perfis são visíveis para o próprio dono"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário edita o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuário cria o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Cria automaticamente um perfil quando um novo usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- conversations — uma conversa entre um usuário e um personagem.
-- ============================================================================
create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  character_id text not null,                 -- id de data/santos.json
  title        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists conversations_user_idx
  on public.conversations (user_id, updated_at desc);

alter table public.conversations enable row level security;

create policy "Conversas pertencem ao usuário"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- messages — mensagens de uma conversa ({role, content}, como no /api/chat).
-- ============================================================================
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

-- Acesso às mensagens é derivado da posse da conversa.
create policy "Mensagens seguem a posse da conversa"
  on public.messages for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- favorites — personagens favoritados pelo usuário.
-- ============================================================================
create table if not exists public.favorites (
  user_id      uuid not null references auth.users (id) on delete cascade,
  character_id text not null,                 -- id de data/santos.json
  created_at   timestamptz not null default now(),
  primary key (user_id, character_id)
);

alter table public.favorites enable row level security;

create policy "Favoritos pertencem ao usuário"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- prayer_intentions — intenções de oração registradas pelo usuário.
-- ============================================================================
create table if not exists public.prayer_intentions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  character_id text,                          -- opcional: santo associado
  body         text not null,
  answered     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists prayer_intentions_user_idx
  on public.prayer_intentions (user_id, created_at desc);

alter table public.prayer_intentions enable row level security;

create policy "Intenções pertencem ao usuário"
  on public.prayer_intentions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
