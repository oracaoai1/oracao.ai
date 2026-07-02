// API do Estúdio de Vozes (somente admin).
// GET  -> vozes disponíveis no ElevenLabs + configurações salvas.
// POST -> salva (upsert) a configuração de um santo ou do padrão global;
//         { reset: true } remove a linha (volta ao padrão).
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAllVoiceSettings, DEFAULTS, clamp01, clampSpeed } from "@/lib/voiceConfig";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  let voices = [];
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    });
    const j = await r.json();
    voices = (j.voices || []).map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      labels: v.labels || {},
    }));
  } catch {
    /* devolve lista vazia se falhar */
  }

  const settings = await getAllVoiceSettings();
  return NextResponse.json({ voices, settings, defaults: DEFAULTS });
}

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const id = String(body.character_id || "").trim();
  if (!id) return NextResponse.json({ error: "character_id obrigatório." }, { status: 400 });

  const supabase = getSupabaseAdmin();

  if (body.reset) {
    await supabase.from("voice_settings").delete().eq("character_id", id);
    return NextResponse.json({ ok: true, reset: true });
  }

  const voice_id =
    body.voice_id && /^[A-Za-z0-9]{16,32}$/.test(body.voice_id) ? body.voice_id : null;

  const row = {
    character_id: id,
    voice_id,
    stability: clamp01(body.stability, DEFAULTS.stability),
    similarity_boost: clamp01(body.similarity_boost, DEFAULTS.similarity_boost),
    style: clamp01(body.style, DEFAULTS.style),
    speed: clampSpeed(body.speed, DEFAULTS.speed),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("voice_settings")
    .upsert(row, { onConflict: "character_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, row });
}
