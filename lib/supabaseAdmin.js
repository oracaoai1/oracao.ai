// lib/supabaseAdmin.js
// Cliente Supabase com service role key — ignora RLS.
// Criação lazy: só inicializa quando chamado pela primeira vez,
// evitando crash no build quando as env vars ainda não estão configuradas.
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabaseAdmin() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.'
    );
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
