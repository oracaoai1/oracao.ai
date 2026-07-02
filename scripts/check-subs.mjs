// Consulta rápida do estado das assinaturas (usa SUPABASE_DB_URL do .env.local).
import { readFileSync } from "node:fs";
import pg from "pg";

const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of txt.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const subs = await client.query(
  `select left(user_id::text, 8) as usuario, plan, status,
          current_period_end, created_at, updated_at
     from public.subscriptions
     order by updated_at desc limit 5`
);
console.log("ASSINATURAS:", subs.rows.length ? "" : "(nenhuma ainda)");
for (const r of subs.rows) console.log(JSON.stringify(r));
await client.end();
