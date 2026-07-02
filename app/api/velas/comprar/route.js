// POST /api/velas/comprar — pagamento único de um pacote de Velas via Asaas.
// O crédito acontece no webhook, quando o pagamento confirma.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PACOTES_VELAS } from "@/lib/plans";
import { findOrCreateCustomer, createOneTimePayment } from "@/lib/asaas";

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para comprar Velas." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const pacoteId = String(body.pacote || "");
  const pacote = PACOTES_VELAS[pacoteId];
  if (!pacote) {
    return NextResponse.json({ error: "Pacote inválido." }, { status: 400 });
  }

  const cpfCnpj = onlyDigits(body.cpfCnpj);
  if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
    return NextResponse.json(
      { error: "Informe um CPF ou CNPJ válido." },
      { status: 400 }
    );
  }

  try {
    const name = user.user_metadata?.display_name || user.email;
    const customer = await findOrCreateCustomer({
      name, email: user.email, cpfCnpj, userId: user.id,
    });

    const payment = await createOneTimePayment({
      customerId: customer.id,
      value: pacote.valor,
      description: `Oração.AI — ${pacote.velas} Velas`,
      // O webhook lê este formato para creditar: velas:<pacote>:<userId>
      externalReference: `velas:${pacoteId}:${user.id}`,
    });

    if (!payment?.invoiceUrl) throw new Error("Fatura não disponível.");
    return NextResponse.json({ url: payment.invoiceUrl });
  } catch (err) {
    console.error("[velas/comprar]", err);
    return NextResponse.json(
      { error: err.message || "Não foi possível iniciar a compra." },
      { status: 500 }
    );
  }
}
