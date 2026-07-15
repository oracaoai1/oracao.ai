// DELETE /api/conta/excluir — o próprio usuário exclui sua conta e dados.
// Cancela a assinatura no Asaas (se houver) e remove o usuário no Supabase
// Auth; as tabelas de conversas, favoritos, intenções, assinatura etc. têm
// "on delete cascade" a partir de auth.users e são removidas automaticamente.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { cancelSubscription } from "@/lib/asaas";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login novamente." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("asaas_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.asaas_subscription_id && subscription.status === "active") {
    try {
      await cancelSubscription(subscription.asaas_subscription_id);
    } catch (err) {
      console.error("[conta/excluir] falha ao cancelar assinatura Asaas", err);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[conta/excluir]", error);
    return NextResponse.json(
      { error: "Não foi possível excluir a conta. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
