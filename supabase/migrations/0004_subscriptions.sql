-- Assinaturas premium via Asaas (checkout hospedado).
-- Escrita apenas via service role (webhook/rotas de servidor); usuário só lê.
create table if not exists public.subscriptions (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  asaas_customer_id     text not null,
  asaas_subscription_id text unique,
  plan                  text not null check (plan in ('mensal', 'anual')),
  status                text not null default 'pending'
                        check (status in ('pending', 'active', 'past_due', 'canceled')),
  current_period_end    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists subscriptions_asaas_sub_idx
  on public.subscriptions (asaas_subscription_id);

alter table public.subscriptions enable row level security;

-- Usuário enxerga a própria assinatura; nenhuma política de escrita:
-- inserts/updates acontecem apenas com a service role key (bypassa RLS).
create policy "Assinatura visível para o próprio dono"
  on public.subscriptions for select
  using (auth.uid() = user_id);
