"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AudioPlayerWrapper from "../components/AudioPlayerWrapper";

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function OracaoDoDiaClient() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [santo, setSanto] = useState(null);
  const [streak, setStreak] = useState(null);
  const [marcando, setMarcando] = useState(false);
  const [velasGanhas, setVelasGanhas] = useState(0);
  const [localDate] = useState(() => localDateStr());

  useEffect(() => {
    let ativo = true;
    fetch(`/api/oracao-do-dia?localDate=${localDate}`)
      .then((r) => r.json())
      .then((d) => {
        if (!ativo) return;
        if (d.error) throw new Error(d.error);
        setSanto(d.santoDoDia);
        setStreak(d.streak);
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setLoading(false));
    return () => {
      ativo = false;
    };
  }, [localDate]);

  async function marcarConcluida() {
    if (marcando || !santo) return;
    setMarcando(true);
    setErro("");
    try {
      const r = await fetch("/api/oracao-do-dia/concluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localDate, characterId: santo.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Não foi possível registrar.");
      setStreak({
        currentStreak: d.currentStreak,
        longestStreak: d.longestStreak,
        freezesAvailable: d.freezesAvailable,
        completedToday: true,
      });
      setVelasGanhas(d.velasGanhas || 0);
    } catch (e) {
      setErro(e.message);
    } finally {
      setMarcando(false);
    }
  }

  if (loading) return <p className="intention-muted">Carregando…</p>;
  if (erro && !santo) return <p className="auth-msg error">{erro}</p>;

  return (
    <div>
      <p className="eyebrow" style={{ color: "var(--gold)", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", fontSize: "0.74rem" }}>
        Reza Diária
      </p>
      <h1 style={{ marginBottom: 6 }}>O santo de hoje</h1>

      {streak && (
        <p style={{ color: "var(--ink-soft)", marginBottom: 20 }}>
          🔥 <strong>{streak.currentStreak}</strong>{" "}
          {streak.currentStreak === 1 ? "dia seguido" : "dias seguidos"}
          {streak.longestStreak > streak.currentStreak && (
            <> · recorde: {streak.longestStreak}</>
          )}
          {streak.freezesAvailable > 0 && (
            <> · 🧊 1 perdão disponível esta semana</>
          )}
        </p>
      )}

      <div className="auth-card">
        {santo.image && (
          <img
            src={santo.image}
            alt={santo.name}
            style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px", display: "block" }}
          />
        )}
        <h2 style={{ textAlign: "center", marginBottom: 4 }}>{santo.name}</h2>
        {santo.title && (
          <p style={{ textAlign: "center", color: "var(--ink-soft)", marginBottom: 16 }}>
            {santo.title}
          </p>
        )}
        <p style={{ fontStyle: "italic", textAlign: "center", margin: "0 0 20px" }}>
          {santo.frase}
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <AudioPlayerWrapper text={santo.frase} label="Ouvir a frase de hoje" />
        </div>

        {erro && <div className="auth-msg error">{erro}</div>}

        {velasGanhas > 0 && (
          <div className="auth-msg ok">
            🕯️ +{velasGanhas} Velas por {streak.currentStreak} dias seguidos!
          </div>
        )}

        {!streak ? (
          <p style={{ textAlign: "center" }}>
            <Link href="/entrar" className="btn btn-gold">
              Entre para acompanhar sua sequência
            </Link>
          </p>
        ) : streak.completedToday ? (
          <button className="btn btn-gold" disabled style={{ width: "100%", justifyContent: "center", opacity: 0.7 }}>
            ✓ Concluída hoje
          </button>
        ) : (
          <button
            className="btn btn-gold"
            onClick={marcarConcluida}
            disabled={marcando}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {marcando ? "Marcando…" : "Marcar oração de hoje"}
          </button>
        )}
      </div>
    </div>
  );
}
