"use client";
import { useEffect, useState } from "react";

const NIVEIS = [
  { n: 1, label: "1 · Vislumbre (5-8s) — 3 Velas" },
  { n: 2, label: "2 · Cena breve (15s) — 8 Velas" },
  { n: 3, label: "3 · Cena completa (30s) — 15 Velas" },
  { n: 4, label: "4 · Cena estendida (60s) — 25 Velas" },
  { n: 5, label: "5 · Cinematográfica — 40 Velas" },
  { n: 6, label: "6 · Épica (90s) — 90 Velas" },
];

export default function MediaStudio({ characters }) {
  const [assets, setAssets] = useState([]);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    character_id: characters[0]?.id || "",
    title: "",
    level: 1,
    script: "",
  });

  async function load() {
    const r = await fetch("/api/admin/media");
    const d = await r.json();
    if (!r.ok) { setErro(d.error || "Erro."); return; }
    setAssets(d.assets);
  }
  useEffect(() => { load(); }, []);

  async function api(body) {
    setErro(""); setBusy(true);
    try {
      const r = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erro.");
      return d;
    } catch (e) { setErro(e.message); return null; }
    finally { setBusy(false); }
  }

  async function criar() {
    if (!form.script.trim() || !form.title.trim()) {
      setErro("Preencha título e roteiro."); return;
    }
    const d = await api({ action: "create", ...form });
    if (d) { setForm({ ...form, title: "", script: "" }); load(); }
  }

  async function verificar(id) {
    const d = await api({ action: "check", id });
    if (d) {
      if (d.status === "completed") load();
      else setErro(`Renderização: ${d.status}. Tente de novo em instantes.`);
    }
  }

  const campo = { width: "100%", padding: 8, borderRadius: 8, border: "1px solid rgba(13,27,62,.25)" };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gap: 10, padding: 16, border: "1px solid rgba(13,27,62,.15)", borderRadius: 12 }}>
        <h2 style={{ margin: 0 }}>Nova cena</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <select style={campo} value={form.character_id}
            onChange={(e) => setForm({ ...form, character_id: e.target.value })}>
            {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={campo} value={form.level}
            onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}>
            {NIVEIS.map((n) => <option key={n.n} value={n.n}>{n.label}</option>)}
          </select>
        </div>
        <input style={campo} placeholder="Título da cena (ex.: A oração diante do Crucifixo)"
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea style={{ ...campo, minHeight: 100 }}
          placeholder="Roteiro — o que o santo fala (será narrado com a voz dele)"
          value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} />
        <button disabled={busy} onClick={criar}>
          {busy ? "Gerando…" : "🎬 Gerar cena"}
        </button>
      </div>

      {erro && <p style={{ color: "#b3261e" }}>{erro}</p>}

      <div style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Catálogo ({assets.length})</h2>
        {assets.map((a) => (
          <div key={a.id} style={{ padding: 14, border: "1px solid rgba(13,27,62,.15)", borderRadius: 12 }}>
            <strong>{a.title}</strong> — {a.character_id} · nível {a.level} ·{" "}
            {a.price_velas} 🕯️ · <em>{a.status}</em>
            {a.video_url ? (
              <video src={a.video_url} controls style={{ width: "100%", maxWidth: 420, display: "block", marginTop: 8, borderRadius: 8 }} />
            ) : (
              <div style={{ marginTop: 8 }}>
                <button disabled={busy} onClick={() => verificar(a.id)}>
                  🔄 Verificar renderização
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {a.status !== "publicado" && a.video_url && (
                <button disabled={busy} onClick={() => api({ action: "publish", id: a.id }).then(load)}>
                  ✅ Publicar
                </button>
              )}
              {a.status === "publicado" && (
                <button disabled={busy} onClick={() => api({ action: "unpublish", id: a.id }).then(load)}>
                  ⏸️ Despublicar
                </button>
              )}
              <button disabled={busy} onClick={() => { if (confirm("Excluir esta cena?")) api({ action: "delete", id: a.id }).then(load); }}>
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
        {assets.length === 0 && <p><small>Nenhuma cena ainda — crie a primeira acima.</small></p>}
      </div>
    </div>
  );
}
