// Cliente mínimo do HeyGen (talking photo -> vídeo, sem slot fixo).
const API = "https://api.heygen.com";

function key() {
  const k = process.env.HEYGEN_API_KEY;
  if (!k) throw new Error("HEYGEN_API_KEY não configurada.");
  return k;
}

// Sobe uma foto (JPEG) e devolve o talking_photo_id.
export async function uploadTalkingPhoto(jpegBuffer) {
  const res = await fetch("https://upload.heygen.com/v1/talking_photo", {
    method: "POST",
    headers: { "x-api-key": key(), "Content-Type": "image/jpeg" },
    body: jpegBuffer,
  });
  const data = await res.json().catch(() => ({}));
  const id = data?.data?.talking_photo_id;
  if (!res.ok || !id) {
    throw new Error(data?.message || `HeyGen upload HTTP ${res.status}`);
  }
  return id;
}

// Gera vídeo a partir da foto + áudio (ElevenLabs) público.
export async function generateVideoFromAudio({ talkingPhotoId, audioUrl }) {
  const res = await fetch(`${API}/v2/video/generate`, {
    method: "POST",
    headers: { "x-api-key": key(), "Content-Type": "application/json" },
    body: JSON.stringify({
      video_inputs: [
        {
          character: { type: "talking_photo", talking_photo_id: talkingPhotoId },
          voice: { type: "audio", audio_url: audioUrl },
        },
      ],
      dimension: { width: 1280, height: 720 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  const id = data?.data?.video_id;
  if (!res.ok || !id) {
    throw new Error(data?.error?.message || `HeyGen generate HTTP ${res.status}`);
  }
  return id;
}

// Consulta o status de renderização de um vídeo.
export async function getVideoStatus(videoId) {
  const res = await fetch(
    `${API}/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
    { headers: { "x-api-key": key() } }
  );
  const data = await res.json().catch(() => ({}));
  return {
    status: data?.data?.status || "unknown",
    videoUrl: data?.data?.video_url || null,
    error: data?.data?.error || null,
  };
}
