// Teste HeyGen: foto avulsa (talking photo) -> vídeo curto, SEM slot fixo.
// Se funcionar, escapamos dos US$29/mês por santo.
import { readFileSync } from "node:fs";
import sharp from "sharp";

const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of txt.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?([^'"]*)['"]?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.HEYGEN_API_KEY;

// 1. Converte o webp do santo para JPEG.
const jpg = await sharp(
  new URL("../public/personagens/img-sao-francisco.webp", import.meta.url).pathname.slice(1)
).jpeg({ quality: 92 }).toBuffer();
console.log("JPEG:", jpg.length, "bytes");

// 2. Sobe como talking photo (sem slot).
const up = await fetch("https://upload.heygen.com/v1/talking_photo", {
  method: "POST",
  headers: { "x-api-key": KEY, "Content-Type": "image/jpeg" },
  body: jpg,
});
const upData = await up.json();
console.log("UPLOAD:", up.status, JSON.stringify(upData).slice(0, 200));
const photoId = upData?.data?.talking_photo_id;
if (!photoId) process.exit(1);

// 3. Acha uma voz PT-BR masculina.
const vr = await fetch("https://api.heygen.com/v2/voices", {
  headers: { "x-api-key": KEY },
});
const vd = await vr.json();
const voz = (vd?.data?.voices || []).find(
  (v) => /portuguese/i.test(v.language) && /brazil/i.test(v.language || "") ||
         /pt-BR/i.test(v.language || "")
) || (vd?.data?.voices || []).find((v) => /portuguese/i.test(v.language || ""));
console.log("VOZ:", voz?.voice_id, voz?.name, voz?.language);
if (!voz) process.exit(1);

// 4. Gera um vídeo curto (~8s de fala).
const gen = await fetch("https://api.heygen.com/v2/video/generate", {
  method: "POST",
  headers: { "x-api-key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    video_inputs: [
      {
        character: { type: "talking_photo", talking_photo_id: photoId },
        voice: {
          type: "text",
          voice_id: voz.voice_id,
          input_text:
            "A paz e o bem estejam contigo. Louvado seja o Senhor por toda a criação.",
        },
      },
    ],
    dimension: { width: 1280, height: 720 },
  }),
});
const genData = await gen.json();
console.log("GENERATE:", gen.status, JSON.stringify(genData).slice(0, 200));
const videoId = genData?.data?.video_id;
if (!videoId) process.exit(1);

// 5. Aguarda a renderização (até ~4 min).
for (let i = 0; i < 24; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  const st = await fetch(
    `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
    { headers: { "x-api-key": KEY } }
  );
  const sd = await st.json();
  const status = sd?.data?.status;
  console.log(`[${(i + 1) * 10}s]`, status);
  if (status === "completed") {
    console.log("VIDEO_URL:", sd.data.video_url);
    break;
  }
  if (status === "failed") {
    console.log("FALHA:", JSON.stringify(sd.data?.error).slice(0, 300));
    break;
  }
}
