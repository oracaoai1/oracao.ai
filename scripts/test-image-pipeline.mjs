// Cria o bucket 'media' (público) e testa a geração de imagem ponta a ponta.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of txt.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?([^'"]*)['"]?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { error: bErr } = await admin.storage.createBucket("media", { public: true });
console.log("BUCKET media:", bErr ? bErr.message : "criado");

const prompt =
  'Sacred Catholic devotional art, classical oil painting style, warm divine ' +
  'golden light. A scene inspired by these words of São Francisco de Assis: ' +
  '"Louvado sejas, meu Senhor, com todas as Tuas criaturas, especialmente o ' +
  'irmão sol". Reverent, dignified. No text, no watermark.';

const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Key ${process.env.FAL_API_KEY}`,
  },
  body: JSON.stringify({
    prompt, image_size: "landscape_4_3", num_images: 1,
    output_format: "jpeg", safety_tolerance: "1",
  }),
});
const data = await res.json();
console.log("FAL STATUS:", res.status);
const url = data?.images?.[0]?.url;
if (!url) { console.log("SEM IMAGEM:", JSON.stringify(data).slice(0, 300)); process.exit(1); }

const img = Buffer.from(await (await fetch(url)).arrayBuffer());
const path = `teste/sao-francisco-${Date.now()}.jpg`;
const { error: upErr } = await admin.storage.from("media")
  .upload(path, img, { contentType: "image/jpeg" });
console.log("UPLOAD:", upErr ? upErr.message : "ok");
const { data: pub } = admin.storage.from("media").getPublicUrl(path);
console.log("URL PUBLICA:", pub.publicUrl);
