// POST /api/assinatura — cria assinatura no tier/ciclo escolhido (Asaas).
// GET — status da assinatura do usuário logado.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TIERS } from "@/lib/plans";
import {
  findOrCreateCustomer,
  createSubscription,
  getFirstPaymentUrl,
} from "@/lib/asaas";

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ subscription: null });

  const { data } = await supabase
    .from("subscriptions")
    .select("tier, cycle, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({ subscription: data || null });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para assinar." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tierId = String(body.tier || "");
  const cycle = body.cycle === "anual" ? "anual" : "mensal";
  const tier = TIERS[tierId];
  if (!tier) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  const cpfCnpj = onlyDigits(body.cpfCnpj);
  if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
    return NextResponse.json(
      { error: "Informe um CPF ou CNPJ válido." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const isActive =
    existing?.status === "active" &&
    existing?.current_period_end &&
    new Date(existing.current_period_end) > new Date();
  if (isActive) {
    return NextResponse.json(
      { error: "Você já tem uma assinatura ativa. Fale conosco para mudar de plano." },
      { status: 409 }
    );
  }

  try {
    const name =
      String(body.name || "").trim() ||
      user.user_metadata?.display_name || user.email;
    const value = cycle === "anual" ? tier.anual : tier.mensal;
    const label = `Oração.AI ${tier.label} — ${cycle === "anual" ? "Anual" : "Mensal"}`;

    const customer = await findOrCreateCustomer({
      name, email: user.email, cpfCnpj, userId: user.id,
    });
    const sub = await createSubscription({
      customerId: customer.id,
      value,
      cycle: cycle === "anual" ? "YEARLY" : "MONTHLY",
      description: label,
      userId: user.id,
    });

    const { error: dbError } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        asaas_customer_id: customer.id,
        asaas_subscription_id: sub.id,
        plan: tierId,
        tier: tierId,
        cycle,
        status: "pending",
        last_vela_grant_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (dbError) throw new Error(dbError.message);

    const url = await getFirstPaymentUrl(sub.id);
    if (!url) throw new Error("Fatura não disponível ainda. Tente de novo.");
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[assinatura]", err);
    return NextResponse.json(
      { error: err.message || "Não foi possível iniciar a assinatura." },
      { status: 500 }
    );
  }
}
