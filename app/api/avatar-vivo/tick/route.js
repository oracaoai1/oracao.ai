// POST /api/avatar-vivo/tick — chamado a cada ~60s pelo cliente enquanto a
// sessão de Avatar ao Vivo está aberta. Debita Velas por minuto completado
// e encerra a sessão ao atingir o limite de 15 minutos ou saldo insuficiente.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PRECOS } from "@/lib/plans";

const MAX_MINUTES = 15;

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
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId obrigatório." }, { status: 400 });
  }

  const { data: session, error: selErr } = await supabase
    .from("live_avatar_sessions")
    .select("id, user_id, started_at, ended_at, end_reason, minutes_billed")
    .eq("id", sessionId)
    .maybeSingle();
  if (selErr || !session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  if (session.ended_at) {
    return NextResponse.json({
      ended: true,
      endReason: session.end_reason,
      minutesBilled: session.minutes_billed,
    });
  }

  const admin = getSupabaseAdmin();
  const elapsedSeconds = (Date.now() - new Date(session.started_at).getTime()) / 1000;
  const elapsedMinutes = Math.min(Math.floor(elapsedSeconds / 60), MAX_MINUTES);

  let minutesBilled = session.minutes_billed;
  let endReason = null;

  for (let minute = minutesBilled + 1; minute <= elapsedMinutes; minute++) {
    const { data: paid, error: spendErr } = await supabase.rpc("spend_velas", {
      p_amount: PRECOS.avatarVivoPorMinuto,
      p_kind: "spend_live",
      p_reference: `${sessionId}:${minute}`,
    });
    if (spendErr) {
      console.error("[avatar-vivo/tick] spend:", spendErr.message);
      return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }
    if (paid !== true) {
      endReason = "insufficient_velas";
      break;
    }
    minutesBilled = minute;
  }

  if (!endReason && elapsedMinutes >= MAX_MINUTES) {
    endReason = "time_limit";
  }

  const update = { minutes_billed: minutesBilled };
  if (endReason) {
    update.ended_at = new Date().toISOString();
    update.end_reason = endReason;
  }
  await admin.from("live_avatar_sessions").update(update).eq("id", sessionId);

  return NextResponse.json({
    ended: !!endReason,
    endReason,
    minutesBilled,
    secondsRemaining: Math.max(0, MAX_MINUTES * 60 - elapsedSeconds),
  });
}
