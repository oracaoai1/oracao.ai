// Cron diário (Vercel Cron) — credita as Velas mensais de assinantes ativos.
// Idempotente: reference = <assinatura>:<ano-mês>, índice único no ledger.
// Protegido por CRON_SECRET (a Vercel envia "Authorization: Bearer <secret>").
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TIERS } from "@/lib/plans";

export const runtime = "nodejs";

const GRANT_INTERVAL_DAYS = 28;

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const cutoff = new Date(
    Date.now() - GRANT_INTERVAL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: subs, error } = await admin
    .from("subscriptions")
    .select("user_id, tier, asaas_subscription_id, last_vela_grant_at")
    .eq("status", "active")
    .gt("current_period_end", new Date().toISOString())
    .or(`last_vela_grant_at.is.null,last_vela_grant_at.lt.${cutoff}`);

  if (error) {
    console.error("[cron velas]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const yyyymm = new Date().toISOString().slice(0, 7);
  let granted = 0;

  for (const sub of subs || []) {
    const velas = TIERS[sub.tier]?.velasMes;
    if (!velas) continue;

    const { data: ok, error: grantErr } = await admin.rpc("grant_velas", {
      p_user: sub.user_id,
      p_amount: velas,
      p_kind: "subscription_grant",
      p_reference: `${sub.asaas_subscription_id}:${yyyymm}`,
    });
    if (grantErr) {
      console.error("[cron velas] grant:", sub.user_id, grantErr.message);
      continue;
    }

    await admin
      .from("subscriptions")
      .update({ last_vela_grant_at: new Date().toISOString() })
      .eq("user_id", sub.user_id);

    if (ok === true) granted += 1;
  }

  return NextResponse.json({ checked: subs?.length || 0, granted });
}
