// POST /api/generate-image — gera imagem devocional a partir da RESPOSTA do
// santo (nunca de prompt livre do usuário). Custa PRECOS.imagem Velas.
// Em falha após o débito, as Velas são estornadas automaticamente.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getCharacter } from "@/lib/characters";
import { generateImage, buildDevotionalPrompt } from "@/lib/fal";
import { PRECOS } from "@/lib/plans";
import crypto from "node:crypto";

export const runtime = "nodejs";

const BUCKET = "media";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Faça login para gerar imagens." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const character = getCharacter(body.characterId);
  const sourceText = String(body.sourceText || "").trim();
  if (!character || !sourceText || sourceText.length > 5000) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  // Debita as Velas ANTES de gerar (atômico; saldo nunca fica negativo).
  const { data: paid, error: spendErr } = await supabase.rpc("spend_velas", {
    p_amount: PRECOS.imagem,
    p_kind: "spend_image",
    p_reference: `${character.id}:${crypto.randomUUID()}`,
  });
  if (spendErr) {
    console.error("[generate-image] spend:", spendErr.message);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
  if (paid !== true) {
    return NextResponse.json(
      {
        error: `Você precisa de ${PRECOS.imagem} Vela para gerar uma imagem. Adquira Velas em /assinar. 🕯️`,
      },
      { status: 402 }
    );
  }

  const admin = getSupabaseAdmin();

  async function refund() {
    try {
      await admin.rpc("grant_velas", {
        p_user: user.id,
        p_amount: PRECOS.imagem,
        p_kind: "refund",
        p_reference: `refund:${crypto.randomUUID()}`,
      });
    } catch (e) {
      console.error("[generate-image] refund falhou:", e.message);
    }
  }

  try {
    const prompt = buildDevotionalPrompt(character.name, sourceText);
    const falUrl = await generateImage(prompt);

    // Persiste a imagem no nosso Storage (a URL do fal é temporária).
    const imgRes = await fetch(falUrl);
    if (!imgRes.ok) throw new Error("Falha ao baixar a imagem gerada.");
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const filePath = `chat-imagens/${user.id}/${crypto.randomUUID()}.jpg`;

    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
      });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(filePath);
    const imageUrl = pub.publicUrl;

    await admin.from("generated_images").insert({
      user_id: user.id,
      character_id: character.id,
      conversation_id: body.conversationId || null,
      source_text: sourceText.slice(0, 2000),
      image_url: imageUrl,
    });

    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error("[generate-image]", err);
    await refund();
    return NextResponse.json(
      { error: "Não foi possível gerar a imagem agora. Suas Velas foram devolvidas. 🙏" },
      { status: 500 }
    );
  }
}
