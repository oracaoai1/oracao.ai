// Intenções de oração do usuário (tabela `prayer_intentions`, protegida por
// RLS: cada um só lê/grava as próprias). Usado no navegador. O santo associado
// é opcional e referenciado pelo `character_id` textual (data/santos.json).

const COLS = "id, body, character_id, answered, created_at";

export async function getIntentions(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("prayer_intentions")
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function addIntention(supabase, { body, characterId }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("prayer_intentions")
    .insert({
      user_id: user.id,
      body: body.trim(),
      character_id: characterId || null,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return data;
}

// RLS garante que update/delete só afetam as linhas do próprio usuário.
export async function setAnswered(supabase, id, answered) {
  const { error } = await supabase
    .from("prayer_intentions")
    .update({ answered })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteIntention(supabase, id) {
  const { error } = await supabase
    .from("prayer_intentions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
