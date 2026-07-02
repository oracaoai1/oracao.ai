-- Economia de Velas (1 Vela = R$ 1,00) + tiers de assinatura + catálogo.

-- ============================================================================
-- subscriptions: tier (inicial/medio/especial) e ciclo (mensal/anual).
-- ============================================================================
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions add column if not exists tier text not null default 'inicial';
alter table public.subscriptions add column if not exists cycle text not null default 'mensal';
alter table public.subscriptions add column if not exists last_vela_grant_at timestamptz;

do $$ begin
  alter table public.subscriptions
    add constraint subscriptions_tier_check check (tier in ('inicial','medio','especial'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.subscriptions
    add constraint subscriptions_cycle_check check (cycle in ('mensal','anual'));
exception when duplicate_object then null; end $$;

update public.subscriptions
  set tier = 'inicial',
      cycle = case when plan = 'anual' then 'anual' else 'mensal' end;

-- ============================================================================
-- vela_balances — saldo atual por usuário (nunca negativo).
-- ============================================================================
create table if not exists public.vela_balances (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  balance    integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
alter table public.vela_balances enable row level security;
create policy "Saldo visível para o dono"
  on public.vela_balances for select using (auth.uid() = user_id);

-- ============================================================================
-- vela_transactions — ledger completo e auditável.
-- ============================================================================
create table if not exists public.vela_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  amount     integer not null,           -- positivo = crédito, negativo = gasto
  kind       text not null check (kind in
             ('purchase','subscription_grant','engagement',
              'spend_image','spend_video','spend_live','adjust','refund')),
  reference  text,                       -- id do pagamento, asset, sessão etc.
  created_at timestamptz not null default now()
);
create index if not exists vela_tx_user_idx
  on public.vela_transactions (user_id, created_at desc);
-- Idempotência de créditos: mesmo pagamento/ciclo nunca credita duas vezes.
create unique index if not exists vela_tx_credit_ref_uidx
  on public.vela_transactions (kind, reference)
  where kind in ('purchase','subscription_grant') and reference is not null;
alter table public.vela_transactions enable row level security;
create policy "Transações visíveis para o dono"
  on public.vela_transactions for select using (auth.uid() = user_id);

-- ============================================================================
-- media_assets — catálogo de cenas em vídeo (escada de níveis 1-6).
-- ============================================================================
create table if not exists public.media_assets (
  id               uuid primary key default gen_random_uuid(),
  character_id     text not null,
  title            text not null,
  description      text,
  level            integer not null check (level between 1 and 6),
  price_velas      integer not null check (price_velas > 0),
  engine           text not null default 'avatar3',
  duration_seconds integer,
  video_url        text,
  thumb_url        text,
  status           text not null default 'rascunho'
                   check (status in ('rascunho','aprovado','publicado')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists media_assets_character_idx
  on public.media_assets (character_id, level);
alter table public.media_assets enable row level security;
-- Catálogo publicado é visível a todos (inclusive visitantes);
-- escrita apenas via service role (Estúdio de Mídia / admin).
create policy "Catálogo publicado é público"
  on public.media_assets for select using (status = 'publicado');

-- ============================================================================
-- user_unlocks — posse permanente de cenas desbloqueadas.
-- ============================================================================
create table if not exists public.user_unlocks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  asset_id   uuid not null references public.media_assets (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, asset_id)
);
alter table public.user_unlocks enable row level security;
create policy "Desbloqueios visíveis para o dono"
  on public.user_unlocks for select using (auth.uid() = user_id);

-- ============================================================================
-- generated_images — imagens geradas no chat (rever é grátis; gerar custa).
-- ============================================================================
create table if not exists public.generated_images (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  character_id    text not null,
  conversation_id uuid references public.conversations (id) on delete set null,
  source_text     text not null,
  image_url       text not null,
  created_at      timestamptz not null default now()
);
create index if not exists generated_images_user_idx
  on public.generated_images (user_id, created_at desc);
alter table public.generated_images enable row level security;
create policy "Imagens geradas visíveis para o dono"
  on public.generated_images for select using (auth.uid() = user_id);

-- ============================================================================
-- RPC spend_velas — débito atômico do usuário logado.
-- ============================================================================
create or replace function public.spend_velas(p_amount integer, p_kind text, p_reference text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null or p_amount <= 0 then return false; end if;
  update public.vela_balances
     set balance = balance - p_amount, updated_at = now()
   where user_id = v_user and balance >= p_amount;
  if not found then return false; end if;
  insert into public.vela_transactions (user_id, amount, kind, reference)
  values (v_user, -p_amount, p_kind, p_reference);
  return true;
end;
$$;
revoke all on function public.spend_velas(integer, text, text) from public, anon;
grant execute on function public.spend_velas(integer, text, text) to authenticated;

-- ============================================================================
-- RPC grant_velas — crédito idempotente; APENAS service role.
-- ============================================================================
create or replace function public.grant_velas(p_user uuid, p_amount integer, p_kind text, p_reference text)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if p_user is null or p_amount <= 0 then return false; end if;
  begin
    insert into public.vela_transactions (user_id, amount, kind, reference)
    values (p_user, p_amount, p_kind, p_reference);
  exception when unique_violation then
    return false; -- crédito já aplicado (webhook reentregue etc.)
  end;
  insert into public.vela_balances (user_id, balance, updated_at)
  values (p_user, p_amount, now())
  on conflict (user_id)
  do update set balance = vela_balances.balance + p_amount, updated_at = now();
  return true;
end;
$$;
revoke all on function public.grant_velas(uuid, integer, text, text) from public, anon, authenticated;

-- ============================================================================
-- RPC unlock_media — desbloqueio permanente de uma cena (atômico).
-- ============================================================================
create or replace function public.unlock_media(p_asset uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price integer;
begin
  if v_user is null then return 'nao_autenticado'; end if;

  select price_velas into v_price
    from public.media_assets
   where id = p_asset and status = 'publicado';
  if v_price is null then return 'nao_encontrado'; end if;

  if exists (select 1 from public.user_unlocks
              where user_id = v_user and asset_id = p_asset) then
    return 'ja_desbloqueado';
  end if;

  if not public.spend_velas(v_price, 'spend_video', p_asset::text) then
    return 'saldo_insuficiente';
  end if;

  insert into public.user_unlocks (user_id, asset_id) values (v_user, p_asset);
  return 'ok';
end;
$$;
revoke all on function public.unlock_media(uuid) from public, anon;
grant execute on function public.unlock_media(uuid) to authenticated;
