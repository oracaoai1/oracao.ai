"use client";
// Botão "Ilustrar" exibido sob cada resposta do santo.
// Gera uma imagem devocional derivada da fala do personagem (custa 1 Vela).
import { useState } from "react";
import Link from "next/link";

export default function MessageImageButton({ characterId, text, conversationId }) {
  const [state, setState] = useState("idle"); // idle | loading | ready | error
  const [url, setUrl] = useState("");
  const [erro, setErro] = useState("");

  async function gerar() {
    if (state === "loading") return;
    setState("loading");
    setErro("");
    try {
      const r = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, sourceText: text, conversationId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Não foi possível gerar.");
      setUrl(d.url);
      setState("ready");
    } catch (e) {
      setErro(e.message);
      setState("error");
    }
  }

  if (state === "ready") {
    return (
      <figure style={{ margin: "8px 0 0" }}>
        <img
          src={url}
          alt="Imagem devocional gerada por IA"
          style={{ maxWidth: "100%", borderRadius: 12 }}
        />
        <figcaption style={{ fontSize: 12, opacity: 0.7 }}>
          Imagem gerada por IA, inspirada nas palavras acima.{" "}
          <a href={url} download>Baixar</a>
        </figcaption>
      </figure>
    );
  }

  return (
    <div style={{ marginTop: 4 }}>
      <button
        type="button"
        onClick={gerar}
        disabled={state === "loading"}
        style={{
          fontSize: 13, padding: "4px 10px", borderRadius: 999,
          border: "1px solid rgba(13,27,62,.25)", background: "transparent",
          cursor: "pointer",
        }}
        title="Gerar uma imagem devocional desta resposta (1 Vela)"
      >
        {state === "loading" ? "🕯️ Ilustrando…" : "🖼️ Ilustrar · 1 🕯️"}
      </button>
      {state === "error" && (
        <small style={{ display: "block", color: "#b3261e" }}>
          {erro} {erro.includes("Vela") && <Link href="/assinar">Obter Velas</Link>}
        </small>
      )}
    </div>
  );
}
