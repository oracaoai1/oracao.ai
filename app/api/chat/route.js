import Anthropic from "@anthropic-ai/sdk";
import { getCharacter, buildSystemPrompt } from "@/lib/characters";
import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/subscription";
import {
  consumeUsage,
  CHAT_DAILY_LIMIT,
  CHAT_DAILY_LIMIT_PREMIUM,
  CHAT_MAX_MESSAGE_CHARS,
} from "@/lib/usageLimits";

export const runtime = "nodejs";

// Modelo configurável por ambiente — troque ANTHROPIC_MODEL no .env.local
// (e na Vercel) para mudar sem alterar código. Padrão: Haiku (rápido e mais
// barato). Para máxima qualidade, use "claude-opus-4-8".
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
// Teto de segurança para respostas curtas — a instrução do prompt (ver
// BASE_GUIDANCE em lib/characters.js) é o controle primário; isto é o
// backstop caso o modelo ignore a instrução.
const MAX_TOKENS = 450;

export async function POST(req) {
  // Rota protegida: exige sessão. Evita consumo anônimo da API.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json(
      { error: "Faça login para conversar com os santos." },
      { status: 401 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "Chave da API não configurada. Defina ANTHROPIC_API_KEY no arquivo .env.local.",
      },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { characterId, messages } = body || {};
  const character = getCharacter(characterId);

  if (!character) {
    return Response.json(
      { error: "Personagem não encontrado." },
      { status: 404 }
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "Nenhuma mensagem enviada." },
      { status: 400 }
    );
  }

  // Limite diário por usuário (contador atômico no Supabase).
  // Assinantes premium têm cota maior.
  const premium = await getActiveSubscription(supabase, user.id);
  const dailyLimit = premium ? CHAT_DAILY_LIMIT_PREMIUM : CHAT_DAILY_LIMIT;
  const allowed = await consumeUsage(supabase, "chat", dailyLimit);
  if (!allowed) {
    return Response.json(
      {
        error: premium
          ? "Você atingiu o limite diário de mensagens. Volte amanhã. 🙏"
          : "Você atingiu o limite gratuito de hoje. Assine o Premium em /assinar para continuar. 🙏",
      },
      { status: 429 }
    );
  }

  // Mantém apenas papéis válidos, limita o histórico e o tamanho de cada
  // mensagem (proteção de custo — trunca em vez de rejeitar).
  const history = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-20)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(
        0,
        m.role === "user" ? CHAT_MAX_MESSAGE_CHARS : 4000
      ),
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
    console.error("Erro na API da Anthropic:", err);
    const status = err?.status || 500;
    const message =
      status === 401
        ? "Chave da API inválida. Verifique sua ANTHROPIC_API_KEY."
        : "Não foi possível obter uma resposta agora. Tente novamente em instantes.";
    return Response.json({ error: message }, { status });
  }
}
