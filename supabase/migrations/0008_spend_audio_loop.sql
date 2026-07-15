-- Permite o novo kind 'spend_audio_loop' em vela_transactions:
-- repetir uma oração em loop na Biblioteca Católica custa 1 Vela por ativação
-- (PRECOS.repetirOracao em lib/plans.js).

alter table public.vela_transactions
  drop constraint if exists vela_transactions_kind_check;

alter table public.vela_transactions
  add constraint vela_transactions_kind_check check (kind in
    ('purchase', 'subscription_grant', 'engagement',
     'spend_image', 'spend_video', 'spend_live', 'spend_audio_loop',
     'adjust', 'refund'));
