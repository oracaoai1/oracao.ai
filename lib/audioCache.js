// lib/audioCache.js
// Cache de áudio no Supabase Storage.
// Bucket: "audio-cache" (público), pasta: "oracoes/".
import crypto from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';

const BUCKET = 'audio-cache';
const FOLDER = 'oracoes';

export function hashText(text) {
  return crypto.createHash('sha256').update(text.trim().toLowerCase(), 'utf8').digest('hex');
}

export async function getCachedAudioUrl(text) {
  try {
    const hash = hashText(text);
    const filename = `${hash}.mp3`;
    const { data: files, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(FOLDER, { search: hash, limit: 1 });
    if (error) { console.warn('[audioCache] check error:', error.message); return null; }
    if (!files?.find((f) => f.name === filename)) return null;
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${filename}`);
    return data.publicUrl;
  } catch (e) { console.warn('[audioCache] getCached:', e.message); return null; }
}

export async function cacheAudio(text, audioBuffer) {
  try {
    const hash = hashText(text);
    const path = `${FOLDER}/${hash}.mp3`;
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, audioBuffer, {
      contentType: 'audio/mpeg',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error && !error.message.toLowerCase().includes('already exists')) {
      console.error('[audioCache] upload error:', error.message); return null;
    }
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) { console.error('[audioCache] cacheAudio:', e.message); return null; }
}
