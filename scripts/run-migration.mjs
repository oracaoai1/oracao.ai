// Aplica um arquivo .sql ao banco do Supabase via conexão Postgres direta
// (porta 5432/6543), sem passar pela api.supabase.com.
//
// Uso: node scripts/run-migration.mjs supabase/migrations/0001_init.sql
// Lê a string de conexão de SUPABASE_DB_URL (em .env.local ou no ambiente).
import { readFileSync } from "node:fs";
import pg from "pg";

// Carrega .env.local de forma simples (sem dependências).
function loadEnvLocal() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* sem .env.local — usa o ambiente */
  }
}

loadEnvLocal();

const file = process.argv[2];
if (!file) {
  console.error("Informe o arquivo .sql. Ex.: node scripts/run-migration.mjs supabase/migrations/0001_init.sql");
  process.exit(1);
}
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("Defina SUPABASE_DB_URL em .env.local (Project Settings → Database → Connection string → URI).");
  process.exit(1);
}

const sql = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Supabase exige TLS.
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ Migração aplicada: ${file}`);
} catch (err) {
  console.error("✗ Falha ao aplicar a migração:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
