// POST /api/catalogo/desbloquear — desbloqueio permanente de uma cena.
// Débito atômico via RPC unlock_media (saldo, posse e ledger numa transação).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para desbloquear cenas." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const assetId = String(body.assetId || "");
  if (!assetId) {
    return NextResponse.json({ error: "Cena inválida." }, { status: 400 });
  }

  const { data: result, error } = await supabase.rpc("unlock_media", {
    p_asset: assetId,
  });
  if (error) {
    console.error("[desbloquear]", error.message);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  if (result === "saldo_insuficiente") {
    return NextResponse.json(
      { error: "Velas insuficientes. Adquira mais em /assinar. 🕯️" },
      { status: 402 }
    );
  }
  if (result === "nao_encontrado") {
    return NextResponse.json({ error: "Cena não encontrada." }, { status: 404 });
  }

  // 'ok' ou 'ja_desbloqueado' — entrega a URL do vídeo.
  const admin = getSupabaseAdmin();
  const { data: asset } = await admin
    .from("media_assets")
    .select("video_url")
    .eq("id", assetId)
    .maybeSingle();

  return NextResponse.json({ url: asset?.video_url || null, result });
}
