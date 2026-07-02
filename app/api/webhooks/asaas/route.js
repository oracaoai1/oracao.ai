// Webhook do Asaas — configure no painel (Integrações → Webhooks) apontando
// para https://oracao.ai/api/webhooks/asaas com o token de autenticação
// igual a ASAAS_WEBHOOK_TOKEN. Eventos: cobranças (PAYMENT_*) e assinaturas.
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Dias de acesso concedidos por pagamento confirmado (com folga de 3 dias
// para o ciclo seguinte compensar).
const PERIOD_DAYS = { mensal: 33, anual: 368 };

function periodEnd(plan) {
  const days = PERIOD_DAYS[plan] || PERIOD_DAYS.mensal;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function POST(request) {
  const token = request.headers.get("asaas-access-token");
  if (!process.env.ASAAS_WEBHOOK_TOKEN || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const event = await request.json().catch(() => null);
  if (!event?.event) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const admin = getSupabaseAdmin();
  const type = event.event;

  // Eventos de cobrança vêm com payment.subscription (id da assinatura).
  const subId = event.payment?.subscription || event.subscription?.id;
  if (!subId) return NextResponse.json({ received: true, ignored: true });

  const { data: row } = await admin
    .from("subscriptions")
    .select("user_id, plan")
    .eq("asaas_subscription_id", subId)
    .maybeSingle();
  if (!row) return NextResponse.json({ received: true, unknown: true });

  let patch = null;
  if (type === "PAYMENT_CONFIRMED" || type === "PAYMENT_RECEIVED") {
    patch = { status: "active", current_period_end: periodEnd(row.plan) };
  } else if (type === "PAYMENT_OVERDUE") {
    patch = { status: "past_due" };
  } else if (
    type === "SUBSCRIPTION_DELETED" ||
    type === "SUBSCRIPTION_INACTIVATED" ||
    type === "PAYMENT_REFUNDED" ||
    type === "PAYMENT_CHARGEBACK_REQUESTED"
  ) {
    patch = { status: "canceled" };
  }

  if (patch) {
    const { error } = await admin
      .from("subscriptions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("asaas_subscription_id", subId);
    if (error) {
      console.error("[webhook asaas]", type, error.message);
      // 500 faz o Asaas reenviar o evento depois.
      return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
