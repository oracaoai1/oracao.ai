// POST /api/assinatura — cria a assinatura no Asaas e devolve a URL do
// checkout hospedado. GET — status da assinatura do usuário logado.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  findOrCreateCustomer,
  createSubscription,
  getFirstPaymentUrl,
} from "@/lib/asaas";

const PLANS = {
  mensal: {
    value: Number(process.env.PLAN_MENSAL_VALOR || 14.9),
    cycle: "MONTHLY",
    label: "Oração.AI Premium — Mensal",
  },
  anual: {
    value: Number(process.env.PLAN_ANUAL_VALOR || 119),
    cycle: "YEARLY",
    label: "Oração.AI Premium — Anual",
  },
};

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ subscription: null });

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({ subscription: data || null });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Faça login para assinar." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const plan = PLANS[body.plan];
  if (!plan) {
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

  // Já é assinante ativo? Não cria cobrança duplicada.
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
      { error: "Você já tem uma assinatura ativa." },
      { status: 409 }
    );
  }

  try {
    const name =
      String(body.name || "").trim() ||
      user.user_metadata?.display_name ||
      user.email;

    const customer = await findOrCreateCustomer({
      name,
      email: user.email,
      cpfCnpj,
      userId: user.id,
    });

    const sub = await createSubscription({
      customerId: customer.id,
      value: plan.value,
      cycle: plan.cycle,
      description: plan.label,
      userId: user.id,
    });

    // CPF não é armazenado no nosso banco (minimização LGPD) —
    // segue apenas para o Asaas, que é quem processa a cobrança.
    const { error: dbError } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        asaas_customer_id: customer.id,
        asaas_subscription_id: sub.id,
        plan: body.plan,
        status: "pending",
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
