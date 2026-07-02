// GET /api/catalogo?character=<id> — cenas publicadas do santo.
// video_url só é entregue para cenas já desbloqueadas pelo usuário.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request) {
  const characterId = new URL(request.url).searchParams.get("character");
  if (!characterId) {
    return NextResponse.json({ error: "Personagem obrigatório." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();

  const { data: assets } = await admin
    .from("media_assets")
    .select("id, title, description, level, price_velas, duration_seconds, video_url")
    .eq("character_id", characterId)
    .eq("status", "publicado")
    .order("level", { ascending: true });

  let unlocked = new Set();
  let balance = null;
  if (user) {
    const { data: u } = await admin
      .from("user_unlocks").select("asset_id").eq("user_id", user.id);
    unlocked = new Set((u || []).map((r) => r.asset_id));
    const { data: b } = await admin
      .from("vela_balances").select("balance").eq("user_id", user.id).maybeSingle();
    balance = b?.balance ?? 0;
  }

  const list = (assets || []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    level: a.level,
    price_velas: a.price_velas,
    duration_seconds: a.duration_seconds,
    unlocked: unlocked.has(a.id),
    video_url: unlocked.has(a.id) ? a.video_url : null,
  }));

  return NextResponse.json({ scenes: list, balance, logged: !!user });
}
