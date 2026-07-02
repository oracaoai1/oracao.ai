// Cliente mínimo da API do Asaas (v3).
// Sandbox por padrão; em produção defina ASAAS_API_URL=https://api.asaas.com/v3
// e a ASAAS_API_KEY de produção (Vercel + .env.local).
const ASAAS_API_URL =
  process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3";

async function asaasFetch(path, options = {}) {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurada.");

  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", access_token: key },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.[0]?.description || `Asaas HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Reaproveita o cliente Asaas pelo e-mail; cria se não existir.
export async function findOrCreateCustomer({ name, email, cpfCnpj, userId }) {
  const found = await asaasFetch(
    `/customers?email=${encodeURIComponent(email)}`
  );
  if (found?.data?.length) return found.data[0];
  return asaasFetch("/customers", {
    method: "POST",
    body: { name, email, cpfCnpj, externalReference: userId },
  });
}

// Cria a assinatura com billingType UNDEFINED: o cliente escolhe Pix,
// cartão ou boleto na página de pagamento hospedada pelo Asaas (invoiceUrl).
export async function createSubscription({ customerId, value, cycle, description, userId }) {
  const nextDueDate = new Date().toISOString().slice(0, 10);
  return asaasFetch("/subscriptions", {
    method: "POST",
    body: {
      customer: customerId,
      billingType: "UNDEFINED",
      value,
      cycle, // MONTHLY | YEARLY
      description,
      nextDueDate,
      externalReference: userId,
    },
  });
}

// URL da fatura do primeiro pagamento da assinatura (checkout hospedado).
export async function getFirstPaymentUrl(subscriptionId) {
  const payments = await asaasFetch(`/subscriptions/${subscriptionId}/payments`);
  return payments?.data?.[0]?.invoiceUrl || null;
}
