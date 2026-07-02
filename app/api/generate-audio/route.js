// app/api/generate-audio/route.js
import { NextResponse } from 'next/server';
import { getCachedAudioUrl, cacheAudio } from '@/lib/audioCache';
import {
  getVoiceConfig,
  settingsSig,
  clamp01,
  clampSpeed,
  DEFAULTS,
} from '@/lib/voiceConfig';

const ELEVENLABS_API_KEY  = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

const isVoiceId = (v) => /^[A-Za-z0-9]{16,32}$/.test(v || '');

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, characterId, voiceId } = body || {};
    if (!text?.trim()) return NextResponse.json({ error: 'Texto inválido.' }, { status: 400 });
    if (text.length > 5000) return NextResponse.json({ error: 'Texto muito longo.' }, { status: 400 });
    if (!ELEVENLABS_API_KEY) return NextResponse.json({ error: 'Áudio não configurado.' }, { status: 500 });

    // Resolve voz + configurações:
    //  - com characterId: fonte da verdade é o servidor (voice_settings + defaults);
    //  - sem characterId: usa voiceId + settings enviados (Biblioteca / prévia do estúdio).
    let voice, stability, similarity_boost, style, speed;
    if (characterId) {
      const cfg = await getVoiceConfig(String(characterId));
      voice = isVoiceId(cfg.voice_id) ? cfg.voice_id : ELEVENLABS_VOICE_ID;
      ({ stability, similarity_boost, style, speed } = cfg);
    } else {
      voice = isVoiceId(voiceId) ? voiceId : ELEVENLABS_VOICE_ID;
      stability = clamp01(body.stability, DEFAULTS.stability);
      similarity_boost = clamp01(body.similarity_boost, DEFAULTS.similarity_boost);
      style = clamp01(body.style, DEFAULTS.style);
      speed = clampSpeed(body.speed, DEFAULTS.speed);
    }

    const sig = settingsSig({ stability, similarity_boost, style });

    const cachedUrl = await getCachedAudioUrl(text, voice, sig);
    if (cachedUrl) return NextResponse.json({ url: cachedUrl, cached: true, speed });

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability, similarity_boost, style, use_speaker_boost: true },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err?.detail?.message || 'Erro ao gerar narração.' }, { status: res.status });
    }

    const audioBuffer = Buffer.from(await res.arrayBuffer());
    const savedUrl = await cacheAudio(text, audioBuffer, voice, sig);
    if (savedUrl) return NextResponse.json({ url: savedUrl, cached: false, speed });

    return new Response(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[generate-audio]', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
