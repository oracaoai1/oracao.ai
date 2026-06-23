// Teste end-to-end da persistência de conversas, exercitando lib/conversations.js
// através de um cliente AUTENTICADO (RLS no caminho). Cria um usuário
// descartável, confirma via conexão direta para poder logar, conversa, recarrega
// e limpa tudo.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import {
  getLatestConversation,
  createConversation,
  saveExchange,
} from "../lib/conversations.js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()])
);

const ok = (c, m) => console.log(`${c ? "✓" : "✗"} ${m}`);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const db = new pg.Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

let uid;
try {
  await db.connect();
  const email = `persist+${Date.now()}@oracao.ai`;
  const password = "senhaTeste123";

  // 1) Cadastro + confirmação forçada (só para conseguir logar no teste).
  const { data: su } = await sb.auth.signUp({ email, password });
  uid = su.user.id;
  await db.query("update auth.users set email_confirmed_at = now() where id = $1", [uid]);

  // 2) Login → cliente autenticado.
  const { data: si, error: se } = await sb.auth.signInWithPassword({ email, password });
  ok(!se && si.session, "login do usuário de teste");

  // 3) Sem conversa ainda.
  const empty = await getLatestConversation(sb, "sao-francisco");
  ok(empty === null, "getLatestConversation = null antes de conversar");

  // 4) Cria conversa e grava dois turnos.
  const cid = await createConversation(sb, "sao-francisco", "Como ter mais paz?");
  ok(!!cid, "createConversation retornou id");
  await saveExchange(sb, cid, "Como ter mais paz?", "A paz começa no coração que confia.");
  await saveExchange(sb, cid, "E sobre os animais?", "Irmãos menores, louvam a Deus à sua maneira.");

  // 5) Recarrega e confere ordem/conteúdo.
  const conv = await getLatestConversation(sb, "sao-francisco");
  ok(conv?.id === cid, "recarregou a mesma conversa");
  const roles = conv.messages.map((m) => m.role).join(",");
  ok(roles === "user,assistant,user,assistant", `ordem das mensagens correta (${roles})`);
  ok(conv.messages[0].content === "Como ter mais paz?", "1ª mensagem é a do usuário");
  ok(conv.messages[3].content.includes("Irmãos menores"), "última é a resposta certa");

  // 6) Isolamento RLS: cliente anônimo (sem sessão) não enxerga nada.
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const leaked = await getLatestConversation(anon, "sao-francisco");
  ok(leaked === null, "RLS: usuário anônimo não vê a conversa");
} catch (e) {
  console.error("ERRO:", e.message);
  process.exitCode = 1;
} finally {
  if (uid) {
    await db.query("delete from auth.users where id = $1", [uid]);
    console.log("• usuário de teste removido (cascata limpou conversa/mensagens)");
  }
  await db.end();
}
