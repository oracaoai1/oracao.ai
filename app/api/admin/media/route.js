// API do Estúdio de Mídia (somente admin).
// GET  -> lista todas as cenas do catálogo (qualquer status).
// POST -> { action: 'create' | 'check' | 'publish' | 'unpublish' | 'delete' }
//   create: roteiro -> áudio ElevenLabs (voz do santo) -> vídeo HeyGen
//   check:  consulta a renderização; ao concluir, baixa para o Storage
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { getAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getCharacter } from "@/lib/characters";
import { getVoiceConfig } from "@/lib/voiceConfig";
import { NIVEIS_VIDEO } from "@/lib/plans";
import {
  uploadTalkingPhoto,
  generateVideoFromAudio,
  getVideoStatus,
} from "@/lib/heygen";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "media";

export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json({ assets: data || [], niveis: NIVEIS_VIDEO });
}

// Foto do santo (webp em public/personagens) -> talking_photo_id (com cache).
async function ensureTalkingPhoto(admin, characterId) {
  const { data: cached } = await admin
    .from("heygen_photos")
    .select("talking_photo_id")
    .eq("character_id", characterId)
    .maybeSingle();
  if (cached) return cached.talking_photo_id;

  const file = path.join(
    process.cwd(), "public", "personagens", `img-${characterId}.webp`
  );
  const webp = await readFile(file);
  const jpeg = await sharp(webp).jpeg({ quality: 92 }).toBuffer();
  const id = await uploadTalkingPhoto(jpeg);

  await admin.from("heygen_photos").upsert({
    character_id: characterId,
    talking_photo_id: id,
  });
  return id;
}

// Roteiro -> mp3 com a voz do santo (ElevenLabs) -> URL pública no Storage.
async function narrate(admin, characterId, script) {
  const cfg = await getVoiceConfig(String(characterId));
  const voice = cfg.voice_id || process.env.ELEVENLABS_VOICE_ID;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: cfg.stability,
          similarity_boost: cfg.similarity_boost,
          style: cfg.style,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs HTTP ${res.status}`);
  const mp3 = Buffer.from(await res.arrayBuffer());

  const filePath = `narracao/${crypto.randomUUID()}.mp3`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(filePath, mp3, { contentType: "audio/mpeg" });
  if (error) throw new Error(error.message);
  return admin.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
}

export async function POST(request) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const admin = getSupabaseAdmin();
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  try {
    if (action === "create") {
      const character = getCharacter(body.character_id);
      const script = String(body.script || "").trim();
      const level = Number(body.level);
      if (!character || !script || !NIVEIS_VIDEO[level]) {
        return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      }

      const photoId = await ensureTalkingPhoto(admin, character.id);
      const audioUrl = await narrate(admin, character.id, script);
      const videoId = await generateVideoFromAudio({
        talkingPhotoId: photoId,
        audioUrl,
      });

      const { data: row, error } = await admin
        .from("media_assets")
        .insert({
          character_id: character.id,
          title: String(body.title || "").trim() || "Cena sem título",
          description: String(body.description || "").trim() || null,
          level,
          price_velas: NIVEIS_VIDEO[level].velas,
          engine: "talking_photo",
          script,
          heygen_video_id: videoId,
          status: "rascunho",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ asset: row });
    }

    if (action === "check") {
      const { data: asset } = await admin
        .from("media_assets")
        .select("id, heygen_video_id, video_url")
        .eq("id", body.id)
        .maybeSingle();
      if (!asset) return NextResponse.json({ error: "Cena não encontrada." }, { status: 404 });
      if (asset.video_url) return NextResponse.json({ status: "completed", video_url: asset.video_url });

      const st = await getVideoStatus(asset.heygen_video_id);
      if (st.status !== "completed") {
        return NextResponse.json({ status: st.status, error: st.error });
      }

      // Renderizou: baixa o mp4 (URL do HeyGen expira) para o nosso Storage.
      const vidRes = await fetch(st.videoUrl);
      if (!vidRes.ok) throw new Error("Falha ao baixar o vídeo do HeyGen.");
      const mp4 = Buffer.from(await vidRes.arrayBuffer());
      const filePath = `cenas/${asset.id}.mp4`;
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(filePath, mp4, { contentType: "video/mp4", upsert: true });
      if (upErr) throw new Error(upErr.message);
      const url = admin.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;

      await admin
        .from("media_assets")
        .update({ video_url: url, status: "aprovado", updated_at: new Date().toISOString() })
        .eq("id", asset.id);
      return NextResponse.json({ status: "completed", video_url: url });
    }

    if (action === "publish" || action === "unpublish") {
      const patch =
        action === "publish"
          ? { status: "publicado", ...(body.price_velas ? { price_velas: Number(body.price_velas) } : {}) }
          : { status: "aprovado" };
      const { error } = await admin
        .from("media_assets")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", body.id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await admin.from("media_assets").delete().eq("id", body.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    console.error("[admin/media]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
