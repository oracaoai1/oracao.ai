// Cliente mínimo do Kling (via fal.ai) — image-to-video para os vídeos de
// fundo em loop dos personagens. Reaproveita a FAL_API_KEY já usada em
// lib/fal.js; é um modelo assíncrono (fila), diferente do Flux Pro síncrono.
const MODEL = "fal-ai/kling-video/v2.6/pro/image-to-video";
const QUEUE_BASE = `https://queue.fal.run/${MODEL}`;

function headers() {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new Error("FAL_API_KEY não configurada.");
  return { Authorization: `Key ${key}`, "Content-Type": "application/json" };
}

// Envia o pedido de geração; devolve o request_id para consultar depois.
export async function submitLoopVideo({ imageUrl, prompt, durationSeconds = "10" }) {
  const res = await fetch(QUEUE_BASE, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      prompt,
      start_image_url: imageUrl,
      duration: String(durationSeconds),
      generate_audio: false, // vídeo de fundo é sempre mudo
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.request_id) {
    throw new Error(data?.detail || `Kling submit HTTP ${res.status}`);
  }
  return data.request_id;
}

// Consulta o status da fila: IN_QUEUE | IN_PROGRESS | COMPLETED (ou erro).
export async function getLoopVideoStatus(requestId) {
  const res = await fetch(`${QUEUE_BASE}/requests/${requestId}/status`, {
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || `Kling status HTTP ${res.status}`);
  return data.status;
}

// Busca o resultado (só deve ser chamado depois de status === "COMPLETED").
export async function getLoopVideoResult(requestId) {
  const res = await fetch(`${QUEUE_BASE}/requests/${requestId}`, {
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  const url = data?.video?.url;
  if (!res.ok || !url) {
    throw new Error(data?.detail || `Kling result HTTP ${res.status} (sem vídeo)`);
  }
  return url;
}

// Prompt de movimento (template único, parametrizado pelo nome do santo).
export function buildLoopPrompt(characterName) {
  return (
    `Portrait of ${characterName}, a Catholic saint/figure. Subtle, natural ` +
    `idle motion: gentle breathing, slow occasional blinking, soft head tilt, ` +
    `warm and attentive gaze toward the camera as if listening closely to ` +
    `someone speaking. Serene, reverent, photorealistic. Soft golden ` +
    `devotional lighting. Loopable motion, no text, no watermark, no camera ` +
    `movement.`
  );
}
