"use client";

// Entrada por voz (fala → texto) usando a Web Speech API do navegador.
// Sem custo de servidor; funciona no Chrome/Edge/Android. Em navegadores sem
// suporte (ex.: Firefox), o botão simplesmente não aparece.
import { useEffect, useRef, useState } from "react";

function MicIcon({ on }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
      <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
      {on && <circle cx="19" cy="5" r="3" fill="#c0395f" />}
    </svg>
  );
}

export default function MicButton({ onTranscript, disabled }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) return;
    setSupported(true);

    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const txt = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (txt) cbRef.current?.(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {}
    };
  }, []);

  if (!supported) return null;

  function toggle() {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      return;
    }
    try {
      rec.start();
      setListening(true);
    } catch {
      /* já iniciado */
    }
  }

  return (
    <button
      type="button"
      className={`mic-btn ${listening ? "is-listening" : ""}`}
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? "Parar de gravar" : "Falar sua mensagem"}
      title={listening ? "Ouvindo… toque para parar" : "Falar sua mensagem"}
    >
      <MicIcon on={listening} />
    </button>
  );
}
