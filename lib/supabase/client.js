// Cliente Supabase para uso no NAVEGADOR (Client Components).
// Usa a chave pública "anon"; o acesso aos dados é controlado por RLS.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
