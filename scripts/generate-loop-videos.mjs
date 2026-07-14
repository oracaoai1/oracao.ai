// Gera o vídeo de fundo em loop (silencioso, ~10s) de cada personagem que já
// tem retrato, via Kling 2.6 Pro (fal.ai) a partir da foto pública. Sobe o
// resultado para o Supabase Storage (bucket "media", caminho loops/<id>.mp4).
//
// Script rodado manualmente pelo operador — não mexe em lib/characters.js
// sozinho. Depois de assistir e aprovar os vídeos, adicione os ids ao
// WITH_LOOP_VIDEO em lib/characters.js numa mudança de código separada.
//
// Uso:
//   node scripts/generate-loop-videos.mjs                      # todos os que faltam
//   node scripts/generate-loop-videos.mjs --only sao-francisco,santa-rita
//   node scripts/generate-loop-videos.mjs --only sao-francisco --force
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import santosDb from "../data/santos.json" with { type: "json" };
import {
  submitLoopVideo,
  getLoopVideoStatus,
  getLoopVideoResult,
  buildLoopPrompt,
} from "../lib/kling.js";

// Carrega .env.local manualmente (script roda fora do Next.js).
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?([^'"]*)['"]?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SITE_URL = "https://www.oracao.ai";
const BUCKET = "media";
const PREFIX = "loops";
const DURATION = "10";
const POLL_INTERVAL_MS = 6000;
const POLL_MAX_TRIES = 60; // ~6 min por vídeo

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only"));
const only = onlyArg
  ? (onlyArg.includes("=") ? onlyArg.split("=")[1] : args[args.indexOf(onlyArg) + 1])
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;
const force = args.includes("--force");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// WITH_IMAGE de lib/characters.js — duplicado aqui de propósito (o script
// roda fora do Next.js e não pode usar o alias de import "@/").
const WITH_IMAGE = new Set([
  "sao-francisco", "santo-agostinho", "sao-gabriel", "santa-teresinha",
  "jesus-cristo", "ns-aparecida", "sao-bento", "santa-rita",
  "santa-teresa-avila", "sao-joao-da-cruz", "sao-tomas-aquino", "santo-afonso",
  "sao-jose", "sao-judas-tadeu", "sao-sebastiao", "santo-antonio",
  "sao-jorge", "sao-cristovao", "santa-luzia", "frei-galvao",
  "santa-dulce", "ns-fatima", "ns-perpetuo-socorro", "ns-lourdes",
  "ns-gracas", "santa-faustina", "madre-teresa", "carlo-acutis",
  "sao-miguel", "sao-rafael",
]);

async function jaExiste(id) {
  const { data } = await admin.storage.from(BUCKET).list(PREFIX, { search: `${id}.mp4` });
  return (data || []).some((f) => f.name === `${id}.mp4`);
}

async function esperar(statusUrl) {
  for (let i = 0; i < POLL_MAX_TRIES; i++) {
    const status = await getLoopVideoStatus(statusUrl);
    if (status === "COMPLETED") return;
    if (status === "ERROR" || status === "FAILED") {
      throw new Error(`Kling retornou status ${status}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("timeout aguardando renderização");
}

async function gerarUm(santo) {
  const imageUrl = `${SITE_URL}/personagens/img-${santo.id}.webp`;
  const prompt = buildLoopPrompt(santo.nome);

  const { statusUrl, resultUrl } = await submitLoopVideo({ imageUrl, prompt, durationSeconds: DURATION });
  await esperar(statusUrl);
  const falUrl = await getLoopVideoResult(resultUrl);

  const res = await fetch(falUrl);
  if (!res.ok) throw new Error(`falha ao baixar vídeo do fal (HTTP ${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const path = `${PREFIX}/${santo.id}.mp4`;
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: "video/mp4", upsert: true });
  if (upErr) throw new Error(upErr.message);

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

const candidatos = santosDb.santos.filter((s) => {
  if (!WITH_IMAGE.has(s.id)) return false;
  if (only) return only.includes(s.id);
  return true;
});

if (candidatos.length === 0) {
  console.log("Nenhum personagem correspondente. Confira os ids passados em --only.");
  process.exit(0);
}

console.log(`Gerando vídeo de loop para ${candidatos.length} personagem(ns)...\n`);

const resultados = [];
for (const santo of candidatos) {
  process.stdout.write(`${santo.id.padEnd(24)} `);
  if (!force && (await jaExiste(santo.id))) {
    console.log("já existe (use --force para regenerar)");
    resultados.push({ id: santo.id, status: "pulado", url: null });
    continue;
  }
  try {
    const url = await gerarUm(santo);
    console.log(`ok -> ${url}`);
    resultados.push({ id: santo.id, status: "ok", url });
  } catch (err) {
    console.log(`ERRO: ${err.message}`);
    resultados.push({ id: santo.id, status: "erro", url: null, erro: err.message });
  }
}

console.log("\n--- Resumo ---");
console.table(resultados.map(({ id, status, url, erro }) => ({ id, status, url: url || erro || "" })));

const falhas = resultados.filter((r) => r.status === "erro").length;
process.exit(falhas > 0 ? 1 : 0);
