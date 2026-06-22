import Anthropic from "@anthropic-ai/sdk";
import { getCharacter, buildSystemPrompt } from "@/lib/characters";

export const runtime = "nodejs";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 1024;

export async function POST(req) {
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

  // Mantém apenas papéis válidos e limita o histórico enviado ao modelo.
  const history = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-20)
    .map((m) => ({ role: m.role, content: String(m.content) }));

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
