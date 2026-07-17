// POST /api/avatar-vivo/encerrar — encerra a sessão manualmente (botão
// "encerrar" ou sendBeacon no beforeunload). Idempotente: sessão já encerrada
// simplesmente retorna o estado atual.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sessionId = String(body.sessionId || "");
  const reason = ["user_ended", "error"].includes(body.reason)
    ? body.reason
    : "user_ended";
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId obrigatório." }, { status: 400 });
  }

  const { data: session, error: selErr } = await supabase
    .from("live_avatar_sessions")
    .select("id, user_id, ended_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (selErr || !session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  if (!session.ended_at) {
    const admin = getSupabaseAdmin();
    await admin
      .from("live_avatar_sessions")
      .update({ ended_at: new Date().toISOString(), end_reason: reason })
      .eq("id", sessionId);
  }

  return NextResponse.json({ ok: true });
}
