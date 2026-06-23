// Acesso ao histórico de conversas no Supabase, usado pelo navegador
// (ChatRoom). Todas as operações respeitam a Row Level Security: o usuário
// só lê e grava as próprias conversas. Personagens continuam em
// data/santos.json — aqui guardamos apenas a referência textual (character_id).

// Carrega a conversa mais recente do usuário com um personagem, já com as
// mensagens em ordem. Retorna null se não houver (ou se deslogado).
export async function getLatestConversation(supabase, characterId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("character_id", characterId)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (error || !convs?.length) return null;

  const id = convs[0].id;
  const { data: msgs } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return { id, messages: msgs ?? [] };
}

// Cria uma nova conversa e devolve o id. O título vem da primeira mensagem.
export async function createConversation(supabase, characterId, firstUserText) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const title = (firstUserText || "").trim().slice(0, 60) || null;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, character_id: characterId, title })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// Grava um par usuário→assistente. Usa created_at explícito para garantir a
// ordem (now() seria idêntico para as duas linhas num mesmo INSERT) e atualiza
// o updated_at da conversa, mantendo-a no topo da lista.
export async function saveExchange(supabase, conversationId, userText, assistantText) {
  const now = Date.now();
  const { error } = await supabase.from("messages").insert([
    {
      conversation_id: conversationId,
      role: "user",
      content: userText,
      created_at: new Date(now).toISOString(),
    },
    {
      conversation_id: conversationId,
      role: "assistant",
      content: assistantText,
      created_at: new Date(now + 1).toISOString(),
    },
  ]);
  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}
