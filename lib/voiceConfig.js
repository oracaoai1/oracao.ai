// Resolve a configuração de voz de um personagem no servidor:
// defaults do código  ←  padrão global ('__default__')  ←  override do santo.
import { getSupabaseAdmin } from "./supabaseAdmin";
import { getVoiceId } from "./voices";

export const DEFAULTS = {
  stability: 0.75,
  similarity_boost: 0.8,
  style: 0.2,
  speed: 1.0,
};

const GEN_KEYS = ["stability", "similarity_boost", "style"];

export function clamp01(n, fallback) {
  const x = Number(n);
  if (Number.isNaN(x)) return fallback;
  return Math.min(1, Math.max(0, x));
}
export function clampSpeed(n, fallback = 1.0) {
  const x = Number(n);
  if (Number.isNaN(x)) return fallback;
  return Math.min(2, Math.max(0.5, x));
}

// Assinatura das configs de geração (para a chave de cache). Vazia quando
// tudo está no padrão — preserva o cache já existente.
export function settingsSig({ stability, similarity_boost, style }) {
  if (
    stability === DEFAULTS.stability &&
    similarity_boost === DEFAULTS.similarity_boost &&
    style === DEFAULTS.style
  )
    return "";
  return `${stability}-${similarity_boost}-${style}`;
}

export async function getVoiceConfig(characterId) {
  const cfg = { voice_id: getVoiceId(characterId), ...DEFAULTS };
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("voice_settings")
      .select("character_id, voice_id, stability, similarity_boost, style, speed")
      .in("character_id", ["__default__", characterId]);

    const def = data?.find((r) => r.character_id === "__default__");
    const own = data?.find((r) => r.character_id === characterId);

    // Padrão global aplica só as configs (a voz é por santo).
    if (def) for (const k of [...GEN_KEYS, "speed"]) if (def[k] != null) cfg[k] = def[k];
    if (own) {
      if (own.voice_id) cfg.voice_id = own.voice_id;
      for (const k of [...GEN_KEYS, "speed"]) if (own[k] != null) cfg[k] = own[k];
    }
  } catch {
    /* sem DB: usa defaults do código */
  }
  return cfg;
}

export async function getAllVoiceSettings() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("voice_settings").select("*");
    return data || [];
  } catch {
    return [];
  }
}
