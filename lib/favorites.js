// Favoritos do usuário no Supabase (tabela `favorites`, protegida por RLS:
// cada um só lê/grava os próprios). Usado no navegador. Personagens continuam
// em data/santos.json — aqui guardamos só o `character_id` textual.

// Ids dos personagens favoritados pelo usuário logado (vazio se deslogado).
export async function getFavoriteIds(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("character_id");
  if (error) return [];
  return data.map((r) => r.character_id);
}

export async function addFavorite(supabase, characterId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, character_id: characterId });
  // 23505 = chave duplicada (já era favorito) — ignoramos.
  if (error && error.code !== "23505") throw error;
}

export async function removeFavorite(supabase, characterId) {
  // RLS garante que só apaga as linhas do próprio usuário.
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("character_id", characterId);
  if (error) throw error;
}
