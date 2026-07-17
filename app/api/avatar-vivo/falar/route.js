// POST /api/avatar-vivo/falar — gera a resposta em texto do personagem para
// o Avatar ao Vivo, reaproveitando o mesmo cérebro (system prompt e modelo)
// de /api/chat. Não persiste em conversations/messages — a conversa ao vivo
// não vira histórico de chat.
import Anthropic from "@anthropic-ai/sdk";
import { getCharacter, buildSystemPrompt } from "@/lib/characters";
import { createClient } from "@/lib/supabase/server";
import { CHAT_MAX_MESSAGE_CHARS } from "@/lib/usageLimits";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const MAX_TOKENS = 220;

export async function POST(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Chave da API não configurada." }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { sessionId, characterId, messages } = body || {};
  const character = getCharacter(characterId);
  if (!character) {
    return Response.json({ error: "Personagem não encontrado." }, { status: 404 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Nenhuma mensagem enviada." }, { status: 400 });
  }

  const { data: session, error: selErr } = await supabase
    .from("live_avatar_sessions")
    .select("id, user_id, character_id, ended_at")
    .eq("id", String(sessionId || ""))
    .maybeSingle();
  if (selErr || !session || session.user_id !== user.id || session.ended_at) {
    return Response.json({ error: "Sessão ao vivo inválida ou encerrada." }, { status: 404 });
  }

  const history = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-20)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, m.role === "user" ? CHAT_MAX_MESSAGE_CHARS : 4000),
    }));

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystemPrompt(character),
      messages: history,
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return Response.json({ reply });
  } catch (err) {
    console.error("Erro na API da Anthropic (avatar-vivo/falar):", err);
    return Response.json(
      { error: "Não foi possível obter uma resposta agora. Tente novamente em instantes." },
      { status: err?.status || 500 }
    );
  }
}
