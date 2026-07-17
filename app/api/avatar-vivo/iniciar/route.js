// POST /api/avatar-vivo/iniciar — inicia uma sessão de Avatar ao Vivo
// (HeyGen LiveAvatar, modo LITE). Exige login, assinatura Médio/Especial
// e saldo de pelo menos 1 minuto de Velas. Não debita nada aqui — o débito
// por minuto acontece em /api/avatar-vivo/tick.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getActiveSubscription } from "@/lib/subscription";
import { hasLiveAvatar, getAvatarId } from "@/lib/liveAvatar";
import { TIERS, PRECOS } from "@/lib/plans";

const MAX_SESSION_SECONDS = 15 * 60;

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Faça login para conversar ao vivo." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const characterId = String(body.characterId || "");
  const avatarId = getAvatarId(characterId);
  if (!hasLiveAvatar(characterId) || !avatarId) {
    return NextResponse.json(
      { error: "Este personagem não tem avatar ao vivo disponível." },
      { status: 403 }
    );
  }

  const subscription = await getActiveSubscription(supabase, user.id);
  const tier = subscription ? TIERS[subscription.tier] : null;
  if (!tier?.liveAvatar) {
    return NextResponse.json(
      {
        error:
          "O avatar ao vivo é exclusivo dos planos Médio e Especial. Assine em /assinar. 🕯️",
      },
      { status: 403 }
    );
  }

  const { data: bal } = await supabase
    .from("vela_balances")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();
  if ((bal?.balance || 0) < PRECOS.avatarVivoPorMinuto) {
    return NextResponse.json(
      {
        error: `Você precisa de pelo menos ${PRECOS.avatarVivoPorMinuto} Velas para iniciar. Adquira Velas em /assinar. 🕯️`,
      },
      { status: 402 }
    );
  }

  const key = process.env.HEYGEN_LIVEAVATAR_API_KEY;
  if (!key) {
    console.error("[avatar-vivo/iniciar] HEYGEN_LIVEAVATAR_API_KEY não configurada.");
    return NextResponse.json({ error: "Recurso indisponível no momento." }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "LITE",
        avatar_id: avatarId,
        max_session_duration: MAX_SESSION_SECONDS,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const sessionToken = data?.data?.session_token;
    if (!res.ok || !sessionToken) {
      throw new Error(data?.message || `LiveAvatar HTTP ${res.status}`);
    }

    const admin = getSupabaseAdmin();
    const { data: row, error: insErr } = await admin
      .from("live_avatar_sessions")
      .insert({
        user_id: user.id,
        character_id: characterId,
        heygen_session_id: data.data.session_id || null,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    return NextResponse.json({
      sessionId: row.id,
      heygenToken: sessionToken,
      avatarId,
    });
  } catch (err) {
    console.error("[avatar-vivo/iniciar]", err);
    return NextResponse.json(
      { error: "Não foi possível iniciar a conversa ao vivo agora." },
      { status: 500 }
    );
  }
}
