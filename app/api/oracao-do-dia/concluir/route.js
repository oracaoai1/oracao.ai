// POST /api/oracao-do-dia/concluir — marca a Reza Diária de hoje como
// concluída (débito atômico do streak via RPC) e credita Velas de bônus
// se essa conclusão bateu um marco (7/30/100 dias).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { STREAK_MILESTONES } from "@/lib/plans";

const isValidLocalDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Faça login para marcar sua oração de hoje." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const localDate = String(body.localDate || "");
  const characterId = String(body.characterId || "");
  if (!isValidLocalDate(localDate) || !characterId) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  // complete_daily_prayer retorna uma TABELA (não escalar como spend_velas),
  // então o supabase-js devolve um array de linhas — aqui, sempre 1 linha.
  const { data, error } = await supabase.rpc("complete_daily_prayer", {
    p_local_date: localDate,
    p_character_id: characterId,
  });
  if (error) {
    if (error.message?.includes("invalid_local_date")) {
      return NextResponse.json(
        {
          error:
            "Não foi possível registrar a data. Verifique o relógio do seu aparelho.",
        },
        { status: 400 }
      );
    }
    console.error("[oracao-do-dia/concluir]", error.message);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  const row = data?.[0] || {};
  let velasGanhas = 0;
  const milestone = row.milestone_hit;
  if (milestone && STREAK_MILESTONES[milestone]) {
    const admin = getSupabaseAdmin();
    const { error: grantErr } = await admin.rpc("grant_velas", {
      p_user: user.id,
      p_amount: STREAK_MILESTONES[milestone],
      p_kind: "streak_milestone",
      p_reference: `${user.id}:${milestone}`,
    });
    if (grantErr) {
      console.error("[oracao-do-dia/concluir] grant_velas:", grantErr.message);
    } else {
      velasGanhas = STREAK_MILESTONES[milestone];
    }
  }

  return NextResponse.json({
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    freezesAvailable: row.freezes_available,
    velasGanhas,
  });
}
