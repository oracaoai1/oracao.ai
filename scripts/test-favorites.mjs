// Teste end-to-end dos favoritos via cliente AUTENTICADO (RLS no caminho).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { getFavoriteIds, addFavorite, removeFavorite } from "../lib/favorites.js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].trim()])
);
const ok = (c, m) => console.log(`${c ? "✓" : "✗"} ${m}`);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const db = new pg.Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

let uid;
try {
  await db.connect();
  const email = `fav+${Date.now()}@oracao.ai`, password = "senhaTeste123";
  const { data: su } = await sb.auth.signUp({ email, password });
  uid = su.user.id;
  await db.query("update auth.users set email_confirmed_at = now() where id=$1", [uid]);
  const { data: si, error: se } = await sb.auth.signInWithPassword({ email, password });
  ok(!se && si.session, "login");

  ok((await getFavoriteIds(sb)).length === 0, "sem favoritos no início");

  await addFavorite(sb, "sao-francisco");
  await addFavorite(sb, "santa-rita");
  await addFavorite(sb, "sao-francisco"); // duplicado -> deve ser ignorado
  let ids = await getFavoriteIds(sb);
  ok(ids.length === 2 && ids.includes("sao-francisco") && ids.includes("santa-rita"),
     `2 favoritos, duplicado ignorado (${ids.sort().join(",")})`);

  await removeFavorite(sb, "sao-francisco");
  ids = await getFavoriteIds(sb);
  ok(ids.length === 1 && ids[0] === "santa-rita", `remoção ok (${ids.join(",")})`);

  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  ok((await getFavoriteIds(anon)).length === 0, "RLS: anônimo não vê favoritos");
} catch (e) {
  console.error("ERRO:", e.message); process.exitCode = 1;
} finally {
  if (uid) { await db.query("delete from auth.users where id=$1", [uid]); console.log("• usuário de teste removido"); }
  await db.end();
}
