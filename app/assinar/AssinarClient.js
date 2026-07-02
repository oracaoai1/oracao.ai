"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const PLANOS = [
  { id: "anual", nome: "Anual", preco: "R$ 119/ano", detalhe: "equivale a R$ 9,90/mês", destaque: true },
  { id: "mensal", nome: "Mensal", preco: "R$ 14,90/mês", detalhe: "cancele quando quiser", destaque: false },
];

const cardStyle = (ativo, destaque) => ({
  border: ativo ? "2px solid #C9A84C" : "1px solid rgba(13,27,62,.18)",
  borderRadius: 12,
  padding: "14px 16px",
  cursor: "pointer",
  background: destaque ? "rgba(201,168,76,.08)" : "transparent",
  textAlign: "left",
  width: "100%",
});

export default function AssinarClient() {
  const [status, setStatus] = useState(null); // assinatura atual (ou null)
  const [logado, setLogado] = useState(null); // null = carregando
  const [plano, setPlano] = useState("anual");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    fetch("/api/assinatura")
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.subscription || null);
        setLogado(d.subscription !== undefined);
      })
      .catch(() => setLogado(true));
  }, []);

  async function assinar() {
    setErro("");
    setCarregando(true);
    try {
      const r = await fetch("/api/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plano, cpfCnpj: cpf }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Não foi possível continuar.");
      window.location.href = d.url; // checkout hospedado do Asaas
    } catch (e) {
      setErro(e.message);
      setCarregando(false);
    }
  }

  const ativa =
    status?.status === "active" &&
    new Date(status.current_period_end) > new Date();

  if (ativa) {
    return (
      <p>
        ✨ Sua assinatura <strong>{status.plan}</strong> está ativa até{" "}
        {new Date(status.current_period_end).toLocaleDateString("pt-BR")}.
        Obrigado por apoiar o Oração.AI!
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {PLANOS.map((p) => (
        <button key={p.id} type="button" style={cardStyle(plano === p.id, p.destaque)} onClick={() => setPlano(p.id)}>
          <strong>{p.nome}</strong> — {p.preco}
          <br />
          <small>{p.detalhe}{p.destaque ? " · mais escolhido" : ""}</small>
        </button>
      ))}

      <label style={{ display: "grid", gap: 4 }}>
        <span>CPF (exigido pelo processador de pagamento)</span>
        <input
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="off"
        />
      </label>

      {erro && <p style={{ color: "#b3261e" }}>{erro}</p>}

      <button type="button" onClick={assinar} disabled={carregando}>
        {carregando ? "Preparando pagamento…" : "Assinar agora"}
      </button>

      <small>
        O pagamento é processado pelo Asaas (Pix, cartão ou boleto). Seu CPF é
        enviado apenas ao processador e não fica salvo no Oração.AI. Precisa de
        conta? <Link href="/cadastro">Cadastre-se</Link> ou{" "}
        <Link href="/entrar">entre</Link> antes de assinar.
      </small>
    </div>
  );
}
