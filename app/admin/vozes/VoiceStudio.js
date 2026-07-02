"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAudioGeneration } from "@/app/components/useAudioGeneration";

const PREVIEW_TEXT =
  "A paz esteja contigo. Que a graça de Deus ilumine o teu coração.";

const SLIDERS = [
  { key: "stability", label: "Estabilidade", min: 0, max: 1, step: 0.05, hint: "Mais alto = mais constante; mais baixo = mais expressivo." },
  { key: "similarity_boost", label: "Semelhança", min: 0, max: 1, step: 0.05, hint: "Fidelidade ao timbre original da voz." },
  { key: "style", label: "Estilo", min: 0, max: 1, step: 0.05, hint: "Exagero de entonação/emoção." },
  { key: "speed", label: "Velocidade", min: 0.5, max: 2, step: 0.05, hint: "Velocidade de reprodução." },
];

function VoiceRow({ id, name, isDefault, voices, defaults, initial }) {
  const base = { voice_id: "", ...defaults, ...(initial || {}) };
  const [voiceId, setVoiceId] = useState(base.voice_id || "");
  const [vals, setVals] = useState({
    stability: base.stability,
    similarity_boost: base.similarity_boost,
    style: base.style,
    speed: base.speed,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { status, audioUrl, speed, generate } = useAudioGeneration();
  const audioRef = useRef(null);

  useEffect(() => {
    if (status === "ready" && audioRef.current) {
      audioRef.current.playbackRate = speed || vals.speed || 1;
      audioRef.current.play().catch(() => {});
    }
  }, [status, audioUrl]); // eslint-disable-line

  function preview() {
    // Prévia com valores atuais (não salvos): envia voiceId + settings explícitos.
    generate(PREVIEW_TEXT, {
      voiceId: voiceId || undefined,
      stability: vals.stability,
      similarity_boost: vals.similarity_boost,
      style: vals.style,
      speed: vals.speed,
    });
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch("/api/admin/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: id, voice_id: voiceId || null, ...vals }),
      });
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    await fetch("/api/admin/voices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character_id: id, reset: true }),
    });
    setVoiceId("");
    setVals({
      stability: defaults.stability,
      similarity_boost: defaults.similarity_boost,
      style: defaults.style,
      speed: defaults.speed,
    });
  }

  return (
    <div className={`vrow ${isDefault ? "is-default" : ""}`}>
      <div className="vrow-head">
        <strong>{isDefault ? "★ Padrão global" : name}</strong>
        <div className="vrow-actions">
          <button className="link-btn" onClick={preview} disabled={status === "loading"}>
            {status === "loading" ? "Gerando…" : "▶ Prévia"}
          </button>
          <button className="btn btn-gold vrow-save" onClick={save} disabled={saving}>
            {saving ? "Salvando…" : saved ? "✓ Salvo" : "Salvar"}
          </button>
          <button className="link-btn" onClick={reset} title="Voltar ao padrão">
            Reset
          </button>
        </div>
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      {!isDefault && (
        <label className="field vrow-voice">
          <span>Voz</span>
          <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
            <option value="">Padrão do sistema</option>
            {voices.map((v) => (
              <option key={v.voice_id} value={v.voice_id}>
                {v.name}
                {v.labels?.gender ? ` · ${v.labels.gender}` : ""}
                {v.labels?.accent ? ` · ${v.labels.accent}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="vrow-sliders">
        {SLIDERS.map((s) => (
          <label key={s.key} className="vslider" title={s.hint}>
            <span>
              {s.label} <em>{Number(vals[s.key]).toFixed(2)}</em>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={vals[s.key]}
              onChange={(e) =>
                setVals((v) => ({ ...v, [s.key]: parseFloat(e.target.value) }))
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function VoiceStudio({ characters }) {
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/voices");
      if (r.status === 403) {
        setState({ loading: false, allowed: false });
        return;
      }
      const data = await r.json();
      setState({ loading: false, allowed: true, ...data });
    })();
  }, []);

  if (state.loading) return <p className="intention-muted">Carregando…</p>;

  if (!state.allowed) {
    return (
      <div className="intention-gate">
        <p>
          Acesso restrito aos administradores. <Link href="/entrar">Entre</Link>{" "}
          com a conta autorizada.
        </p>
      </div>
    );
  }

  const byId = Object.fromEntries((state.settings || []).map((s) => [s.character_id, s]));

  return (
    <div className="vstudio">
      <VoiceRow
        id="__default__"
        isDefault
        voices={state.voices}
        defaults={state.defaults}
        initial={byId["__default__"]}
      />
      {characters.map((c) => (
        <VoiceRow
          key={c.id}
          id={c.id}
          name={c.name}
          voices={state.voices}
          defaults={state.defaults}
          initial={byId[c.id]}
        />
      ))}
    </div>
  );
}
