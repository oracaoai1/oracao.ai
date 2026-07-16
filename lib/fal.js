// Cliente mínimo do fal.ai — Flux Pro 1.1 (texto puro, chamada síncrona) e
// PuLID Flux (texto + retrato de referência, preserva a identidade/rosto do
// personagem — usado sempre que o personagem já tem retrato publicado).
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro/v1.1";
const FAL_PULID_ENDPOINT = "https://fal.run/fal-ai/flux-pulid";

// Gera uma imagem devocional (texto puro, sem referência de rosto) e
// retorna a URL temporária do fal. Fallback para personagens sem retrato.
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

// Gera uma imagem devocional preservando o rosto do personagem, usando o
// retrato já publicado (img-<id>.webp) como referência de identidade
// (PuLID Flux — mesma família de modelo do Flux Pro, sem fine-tuning).
export async function generateImageWithIdentity(prompt, referenceImageUrl) {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new Error("FAL_API_KEY não configurada.");

  const res = await fetch(FAL_PULID_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${key}`,
    },
    body: JSON.stringify({
      prompt,
      reference_image_url: referenceImageUrl,
      image_size: "landscape_4_3",
      enable_safety_checker: true, // mais restritivo — app devocional
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
// `appearance` (opcional) é a descrição física do personagem já usada para
// gerar o retrato original (image_prompt_personagem em santos.json) —
// reforça a identidade em texto, além da referência de rosto (PuLID Flux),
// já que só a imagem de referência não garante o mesmo rosto de forma
// confiável quando o prompt descreve uma cena distante/genérica.
export function buildDevotionalPrompt(characterName, sourceText, appearance) {
  const excerpt = String(sourceText).replace(/\s+/g, " ").trim().slice(0, 600);
  const identityLine = appearance
    ? `Portrait of the SAME person as in the reference photo — ${appearance} `
    : `Portrait of ${characterName}. `;
  return (
    `Sacred Catholic devotional art, classical oil painting style, warm divine ` +
    `golden light, reverent atmosphere. ${identityLine}` +
    `He/she is depicted living out these words: "${excerpt}". Historically ` +
    `respectful, dignified, spiritually uplifting. No text, no letters, no watermark.`
  );
}
