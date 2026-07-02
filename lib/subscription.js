// Consulta a assinatura ativa do usuário (RLS permite ler a própria linha).
// Retorna a assinatura se estiver ativa e dentro do período pago; senão null.
export async function getActiveSubscription(supabase, userId) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("tier, cycle, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const active =
    data.status === "active" &&
    data.current_period_end &&
    new Date(data.current_period_end) > new Date();

  return active ? data : null;
}
