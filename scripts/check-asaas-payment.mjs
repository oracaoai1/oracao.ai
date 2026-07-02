// Diagnóstico: status real da assinatura/pagamento no Asaas.
import { readFileSync } from "node:fs";
import pg from "pg";

const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of txt.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?([^'"]*)['"]?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const { rows } = await client.query(
  "select asaas_subscription_id from public.subscriptions limit 1"
);
await client.end();
const subId = rows[0]?.asaas_subscription_id;
console.log("SUB_ID:", subId);

const r = await fetch(
  `${process.env.ASAAS_API_URL}/subscriptions/${subId}/payments`,
  { headers: { access_token: process.env.ASAAS_API_KEY } }
);
const data = await r.json();
for (const p of data?.data || []) {
  console.log("PAGAMENTO:", p.id, "| status:", p.status, "| valor:", p.value);
}
