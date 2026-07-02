"use client";
// Painel "Cenas do santo" — catálogo de vídeos com desbloqueio por Velas.
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function ScenesPanel({ characterId, characterName, open, onClose }) {
  const [scenes, setScenes] = useState(null);
  const [balance, setBalance] = useState(null);
  const [logged, setLogged] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [erro, setErro] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/catalogo?character=${characterId}`);
      const d = await r.json();
      setScenes(d.scenes || []);
      setBalance(d.balance);
      setLogged(!!d.logged);
    } catch {
      setScenes([]);
    }
  }, [characterId]);

  useEffect(() => {
    if (open) { setErro(""); load(); }
  }, [open, load]);

  async function desbloquear(scene) {
    setErro(""); setBusyId(scene.id);
    try {
      const r = await fetch("/api/catalogo/desbloquear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: scene.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Não foi possível desbloquear.");
      await load();
    } catch (e) {
      setErro(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(13,27,62,.55)",
        zIndex: 60, display: "flex", justifyContent: "flex-end",
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(420px, 100%)", height: "100%", background: "#fff",
          padding: 20, overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>🎬 Cenas de {characterName}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"
            style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {logged && balance !== null && (
          <p style={{ margin: "8px 0 16px" }}>
            Saldo: <strong>{balance} 🕯️</strong>{" "}
            <Link href="/assinar"><small>obter mais Velas</small></Link>
          </p>
        )}
        {!logged && (
          <p style={{ margin: "8px 0 16px" }}>
            <Link href="/entrar">Entre</Link> para desbloquear cenas.
          </p>
        )}
        {erro && <p style={{ color: "#b3261e" }}>{erro}</p>}

        {scenes === null && <p><small>Carregando…</small></p>}
        {scenes?.length === 0 && (
          <p><small>Nenhuma cena publicada ainda para este santo. Em breve! 🙏</small></p>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          {(scenes || []).map((s) => (
            <div key={s.id}
              style={{ border: "1px solid rgba(13,27,62,.15)", borderRadius: 12, padding: 12 }}>
              <strong>{s.title}</strong>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Nível {s.level}
                {s.duration_seconds ? ` · ${s.duration_seconds}s` : ""}
              </div>
              {s.description && <p style={{ fontSize: 13, margin: "6px 0" }}>{s.description}</p>}

              {s.unlocked ? (
                <video src={s.video_url} controls playsInline
                  style={{ width: "100%", borderRadius: 8, marginTop: 6 }} />
              ) : (
                <button
                  type="button"
                  disabled={busyId === s.id || !logged}
                  onClick={() => desbloquear(s)}
                  style={{
                    marginTop: 6, padding: "8px 14px", borderRadius: 999,
                    border: "1px solid #C9A84C", background: "rgba(201,168,76,.12)",
                    cursor: "pointer", fontWeight: 600,
                  }}
                >
                  {busyId === s.id
                    ? "Desbloqueando…"
                    : `🔓 Desbloquear · ${s.price_velas} 🕯️`}
                </button>
              )}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 16 }}>
          Cenas geradas por IA, inspiradas na vida e nas palavras dos santos.
          Desbloqueio único: assista quantas vezes quiser.
        </p>
      </aside>
    </div>
  );
}
