"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TIERS = [
  { id: "inicial", nome: "Inicial", mensal: "R$ 9,90", anual: "R$ 99", velas: 10,
    itens: ["100 mensagens/dia", "Catálogo de imagens", "10 Velas/mês"] },
  { id: "medio", nome: "Médio", mensal: "R$ 29,90", anual: "R$ 299", velas: 35, destaque: true,
    itens: ["500 mensagens/dia", "Cenas em vídeo", "35 Velas/mês", "Avatar ao vivo (com Velas)"] },
  { id: "especial", nome: "Especial", mensal: "R$ 59,90", anual: "R$ 599", velas: 80,
    itens: ["Mensagens ilimitadas", "80 Velas/mês", "Avatar ao vivo incluso", "Fila prioritária"] },
];

const PACOTES = [
  { id: "p10", velas: 10, preco: "R$ 10" },
  { id: "p30", velas: 30, preco: "R$ 27", bonus: "+10%" },
  { id: "p60", velas: 60, preco: "R$ 48", bonus: "+20%" },
  { id: "p120", velas: 120, preco: "R$ 84", bonus: "+30%" },
];

const card = (ativo, destaque) => ({
  border: ativo ? "2px solid #C9A84C" : "1px solid rgba(13,27,62,.18)",
  borderRadius: 12, padding: "14px 16px", cursor: "pointer",
  background: destaque ? "rgba(201,168,76,.08)" : "transparent",
  textAlign: "left", width: "100%",
});

export default function AssinarClient() {
  const [status, setStatus] = useState(null);
  const [tier, setTier] = useState("medio");
  const [ciclo, setCiclo] = useState("mensal");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    fetch("/api/assinatura")
      .then((r) => r.json())
      .then((d) => setStatus(d.subscription || null))
      .catch(() => {});
  }, []);

  async function post(url, body) {
    setErro("");
    setCarregando(true);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Não foi possível continuar.");
      window.location.href = d.url;
    } catch (e) {
      setErro(e.message);
      setCarregando(false);
    }
  }

  const ativa =
    status?.status === "active" &&
    new Date(status.current_period_end) > new Date();

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {ativa && (
        <p>
          ✨ Assinatura <strong>{status.tier}</strong> ({status.cycle}) ativa
          até {new Date(status.current_period_end).toLocaleDateString("pt-BR")}.
        </p>
      )}

      {!ativa && (
        <>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button type="button" style={card(ciclo === "mensal")} onClick={() => setCiclo("mensal")}>
              Mensal
            </button>
            <button type="button" style={card(ciclo === "anual")} onClick={() => setCiclo("anual")}>
              Anual <small>(2 meses grátis)</small>
            </button>
          </div>

          {TIERS.map((t) => (
            <button key={t.id} type="button" style={card(tier === t.id, t.destaque)} onClick={() => setTier(t.id)}>
              <strong>{t.nome}</strong> — {ciclo === "anual" ? `${t.anual}/ano` : `${t.mensal}/mês`}
              {t.destaque ? " · mais escolhido" : ""}
              <br />
              <small>{t.itens.join(" · ")}</small>
            </button>
          ))}
        </>
      )}

      <div className="field">
        <label htmlFor="cpf">CPF (exigido pelo processador de pagamento)</label>
        <input
          id="cpf"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="off"
        />
      </div>

      {erro && <div className="auth-msg error">{erro}</div>}

      {!ativa && (
        <button
          type="button"
          className="btn btn-gold"
          disabled={carregando}
          onClick={() => post("/api/assinatura", { tier, cycle: ciclo, cpfCnpj: cpf })}
        >
          {carregando ? "Preparando pagamento…" : "Assinar agora"}
        </button>
      )}

      <hr />
      <h2 style={{ margin: 0 }}>🕯️ Pacotes de Velas</h2>
      <p style={{ margin: 0 }}>
        <small>
          Velas desbloqueiam cenas em vídeo dos santos, imagens no chat e o
          avatar ao vivo. Compra única, sem assinatura.
        </small>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {PACOTES.map((p) => (
          <button
            key={p.id}
            type="button"
            style={card(false)}
            disabled={carregando}
            onClick={() => post("/api/velas/comprar", { pacote: p.id, cpfCnpj: cpf })}
          >
            <strong>{p.velas} Velas</strong> — {p.preco}
            {p.bonus && <small> ({p.bonus} de bônus)</small>}
          </button>
        ))}
      </div>

      <small>
        Pagamentos processados pelo Asaas (Pix, cartão ou boleto). Seu CPF vai
        apenas ao processador e não fica salvo no Oração.AI. Precisa de conta?{" "}
        <Link href="/cadastro">Cadastre-se</Link> ou{" "}
        <Link href="/entrar">entre</Link>.
      </small>
    </div>
  );
}
