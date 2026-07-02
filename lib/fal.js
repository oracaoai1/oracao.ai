// Cliente mínimo do fal.ai — Flux Pro 1.1 (chamada síncrona).
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro/v1.1";

// Gera uma imagem devocional e retorna a URL temporária do fal.
export async function generateImage(prompt) {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new Error("FAL_API_KEY não configurada.");

  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${key}`,
    },
    body: JSON.stringify({
      prompt,
      image_size: "landscape_4_3",
      num_images: 1,
      output_format: "jpeg",
      safety_tolerance: "1", // mais restritivo — app devocional
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || `fal.ai HTTP ${res.status}`);
  }
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error("fal.ai não retornou imagem.");
  return url;
}

// Prompt devocional derivado da fala do santo (nunca do usuário).
export function buildDevotionalPrompt(characterName, sourceText) {
  const excerpt = String(sourceText).replace(/\s+/g, " ").trim().slice(0, 600);
  return (
    `Sacred Catholic devotional art, classical oil painting style, warm divine ` +
    `golden light, reverent and serene atmosphere. A scene inspired by these ` +
    `words of ${characterName}: "${excerpt}". Historically respectful, ` +
    `dignified, spiritually uplifting. No text, no letters, no watermark.`
  );
}
