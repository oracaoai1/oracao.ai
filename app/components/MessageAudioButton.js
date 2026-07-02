"use client";

// Botão compacto de narração para uma mensagem do chat. Reusa o pipeline
// /api/generate-audio (ElevenLabs + cache no Supabase). Aceita voiceId (voz do
// personagem) e autoStart (auto-narração da resposta recém-chegada).
import { useEffect, useRef, useState } from "react";
import { useAudioGeneration } from "./useAudioGeneration";

function Speaker() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}
function Pause() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

export default function MessageAudioButton({ text, characterId, autoStart = false }) {
  const { status, audioUrl, speed, generate } = useAudioGeneration();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const wantPlay = useRef(false);
  const started = useRef(false);

  // Auto-narração (uma vez) da resposta recém-chegada.
  useEffect(() => {
    if (autoStart && !started.current && text) {
      started.current = true;
      wantPlay.current = true;
      generate(text, { characterId });
    }
  }, [autoStart, text, characterId, generate]);

  // Aplica a velocidade de reprodução configurada para o santo.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed || 1;
  }, [audioUrl, speed]);

  // Assim que o áudio fica pronto e havia intenção de tocar, toca.
  useEffect(() => {
    if (status === "ready" && audioUrl && wantPlay.current) {
      wantPlay.current = false;
      if (audioRef.current) audioRef.current.playbackRate = speed || 1;
      audioRef.current?.play().catch(() => {});
    }
  }, [status, audioUrl, speed]);

  function onClick() {
    if (status === "loading") return;
    if (status === "idle" || status === "error" || !audioUrl) {
      wantPlay.current = true;
      generate(text, { characterId });
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else {
      a.playbackRate = speed || 1;
      a.play().catch(() => {});
    }
  }

  const loading = status === "loading";

  return (
    <span className="msg-audio">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}
      <button
        type="button"
        className={`msg-audio-btn ${playing ? "is-playing" : ""}`}
        onClick={onClick}
        disabled={loading}
        aria-label={playing ? "Pausar narração" : "Ouvir a resposta"}
        title={playing ? "Pausar" : "Ouvir com a voz do personagem"}
      >
        {loading ? (
          <span className="msg-audio-spin" aria-hidden />
        ) : playing ? (
          <Pause />
        ) : (
          <Speaker />
        )}
        <span className="msg-audio-label">
          {loading ? "Preparando…" : playing ? "Pausar" : "Ouvir"}
        </span>
      </button>
    </span>
  );
}
