// GET /api/velas — saldo e extrato recente do usuário logado.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login." }, { status: 401 });
  }

  const { data: bal } = await supabase
    .from("vela_balances")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: tx } = await supabase
    .from("vela_transactions")
    .select("amount, kind, reference, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    balance: bal?.balance || 0,
    transactions: tx || [],
  });
}
