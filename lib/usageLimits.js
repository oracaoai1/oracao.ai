// Limites diários de uso por usuário (proteção de custo + fundação do free tier).
// Configuráveis por ambiente (.env.local e Vercel); padrões conservadores.
export const CHAT_DAILY_LIMIT = parseInt(process.env.CHAT_DAILY_LIMIT || "50", 10);
export const AUDIO_DAILY_LIMIT = parseInt(process.env.AUDIO_DAILY_LIMIT || "20", 10);
export const CHAT_MAX_MESSAGE_CHARS = parseInt(
  process.env.CHAT_MAX_MESSAGE_CHARS || "2000",
  10
);

// Consome 1 unidade da cota diária do usuário logado via RPC atômica.
// Retorna true se permitido. Em falha do contador, permite e registra o erro
// (disponibilidade do produto acima da rigidez do limite).
export async function consumeUsage(supabase, kind, limit) {
  const { data, error } = await supabase.rpc("increment_usage", {
    p_kind: kind,
    p_limit: limit,
  });
  if (error) {
    console.error("[usageLimits]", kind, error.message);
    return true;
  }
  return data === true;
}
