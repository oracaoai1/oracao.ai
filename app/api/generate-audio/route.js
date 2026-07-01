// app/api/generate-audio/route.js
import { NextResponse } from 'next/server';
import { getCachedAudioUrl, cacheAudio } from '@/lib/audioCache';

const ELEVENLABS_API_KEY  = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Texto inválido.' }, { status: 400 });
    if (text.length > 5000) return NextResponse.json({ error: 'Texto muito longo.' }, { status: 400 });
    if (!ELEVENLABS_API_KEY) return NextResponse.json({ error: 'Áudio não configurado.' }, { status: 500 });

    const cachedUrl = await getCachedAudioUrl(text);
    if (cachedUrl) return NextResponse.json({ url: cachedUrl, cached: true });

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.75, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true } }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err?.detail?.message || 'Erro ao gerar narração.' }, { status: res.status });
    }

    const audioBuffer = Buffer.from(await res.arrayBuffer());
    const savedUrl = await cacheAudio(text, audioBuffer);
    if (savedUrl) return NextResponse.json({ url: savedUrl, cached: false });

    return new Response(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[generate-audio]', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
