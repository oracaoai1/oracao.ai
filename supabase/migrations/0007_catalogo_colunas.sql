-- Proteção do catálogo: video_url NUNCA é legível direto pelo cliente
-- (nem anon, nem authenticated) — só o servidor (service role) entrega a URL
-- após verificar o desbloqueio. O RLS continua filtrando por 'publicado';
-- aqui restringimos QUAIS colunas o PostgREST expõe.
revoke select on public.media_assets from anon, authenticated;
grant select (
  id, character_id, title, description, level, price_velas,
  engine, duration_seconds, thumb_url, status, created_at
) on public.media_assets to anon, authenticated;
