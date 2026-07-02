// Migra o assinante atual: valor da assinatura no Asaas -> R$ 9,90 (Inicial).
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
  "select asaas_subscription_id, tier, cycle, status from public.subscriptions"
);
console.log("ANTES:", JSON.stringify(rows));

for (const r of rows) {
  const res = await fetch(
    `${process.env.ASAAS_API_URL}/subscriptions/${r.asaas_subscription_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        access_token: process.env.ASAAS_API_KEY,
      },
      body: JSON.stringify({
        value: 9.9,
        description: "Oração.AI Inicial — Mensal",
        updatePendingPayments: false,
      }),
    }
  );
  const d = await res.json();
  console.log("ASAAS:", r.asaas_subscription_id, res.status, "novo valor:", d.value);
}
await client.end();
