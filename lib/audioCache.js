// lib/audioCache.js
// Cache de áudio no Supabase Storage.
// Bucket: "audio-cache" (público), pasta: "oracoes/".
import crypto from 'crypto';
import { getSupabaseAdmin } from './supabaseAdmin';
import { DEFAULT_VOICE_ID } from './voices';

const BUCKET = 'audio-cache';
const FOLDER = 'oracoes';

// Chave de cache por texto. Vozes não-padrão são prefixadas com o voiceId
// para não colidir com o áudio de outra voz; a voz padrão mantém a chave
// antiga (só texto), preservando o cache já existente da Biblioteca.
export function hashText(text, voiceId) {
  const base = text.trim().toLowerCase();
  const key = !voiceId || voiceId === DEFAULT_VOICE_ID ? base : `${voiceId}|${base}`;
  return crypto.createHash('sha256').update(key, 'utf8').digest('hex');
}

export async function getCachedAudioUrl(text, voiceId) {
  try {
    const supabase = getSupabaseAdmin();
    const hash = hashText(text, voiceId);
    const filename = `${hash}.mp3`;

    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, { search: hash, limit: 1 });

    if (error) { console.warn('[audioCache] check error:', error.message); return null; }
    if (!files?.find((f) => f.name === filename)) return null;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${filename}`);
    return data.publicUrl;
  } catch (e) {
    console.warn('[audioCache] getCached:', e.message);
    return null;
  }
}

export async function cacheAudio(text, audioBuffer, voiceId) {
  try {
    const supabase = getSupabaseAdmin();
    const hash = hashText(text, voiceId);
    const path = `${FOLDER}/${hash}.mp3`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, audioBuffer, {
      contentType: 'audio/mpeg',
      cacheControl: '31536000',
      upsert: false,
    });

    if (error && !error.message.toLowerCase().includes('already exists')) {
      console.error('[audioCache] upload error:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('[audioCache] cacheAudio:', e.message);
    return null;
  }
}
