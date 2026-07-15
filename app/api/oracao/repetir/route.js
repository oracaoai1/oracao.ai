// POST /api/oracao/repetir — debita Velas para ativar a repetição em loop de
// uma oração na Biblioteca Católica. O áudio em si já existe (cacheado);
// esta rota só controla o débito, a reprodução em loop é feita no cliente.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRECOS } from "@/lib/plans";
import crypto from "node:crypto";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Faça login para repetir a oração em loop." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const slug = String(body.slug || "artigo");

  const { data: paid, error } = await supabase.rpc("spend_velas", {
    p_amount: PRECOS.repetirOracao,
    p_kind: "spend_audio_loop",
    p_reference: `${slug}:${crypto.randomUUID()}`,
  });
  if (error) {
    console.error("[oracao/repetir] spend:", error.message);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
  if (paid !== true) {
    return NextResponse.json(
      {
        error: `Você precisa de ${PRECOS.repetirOracao} Vela para repetir em loop. Adquira Velas em /assinar. 🕯️`,
      },
      { status: 402 }
    );
  }

  return NextResponse.json({ ok: true });
}
