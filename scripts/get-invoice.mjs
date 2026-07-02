// Busca a URL da fatura pendente da assinatura.
import { readFileSync } from "node:fs";

const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of txt.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*['"]?([^'"]*)['"]?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const r = await fetch(
  `${process.env.ASAAS_API_URL}/payments/pay_7ffekifkvvv12crr`,
  { headers: { access_token: process.env.ASAAS_API_KEY } }
);
const p = await r.json();
console.log("STATUS:", p.status);
console.log("FATURA:", p.invoiceUrl);
