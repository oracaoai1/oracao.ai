"use client";

// Cliente do Avatar ao Vivo (HeyGen LiveAvatar, modo LITE). O cérebro que
// gera as respostas continua sendo o Claude (via /api/avatar-vivo/falar) —
// o SDK da HeyGen só faz o avatar falar exatamente o texto recebido
// (`session.repeat`), sem decidir nada por conta própria.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MicButton from "@/app/components/MicButton";
import { PRECOS } from "@/lib/plans";

const MAX_MINUTES = 15;

function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function AvatarVivoClient({ character }) {
  const [phase, setPhase] = useState("idle"); // idle | connecting | live | ended
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [balance, setBalance] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const videoRef = useRef(null);
  const sessionRef = useRef(null);
  const sessionIdRef = useRef(null);
  const messagesRef = useRef([]);
  const clockIntervalRef = useRef(null);
  const tickIntervalRef = useRef(null);

  useEffect(() => {
    fetch("/api/velas")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0))
      .catch(() => setBalance(null));
  }, []);

  useEffect(() => {
    function endBeacon() {
      if (sessionIdRef.current && phase === "live") {
        navigator.sendBeacon(
          "/api/avatar-vivo/encerrar",
          new Blob(
            [JSON.stringify({ sessionId: sessionIdRef.current, reason: "user_ended" })],
            { type: "application/json" }
          )
        );
      }
    }
    window.addEventListener("beforeunload", endBeacon);
    return () => {
      window.removeEventListener("beforeunload", endBeacon);
      endBeacon();
      clearInterval(clockIntervalRef.current);
      clearInterval(tickIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function cleanupSession(nextPhase, reason) {
    clearInterval(clockIntervalRef.current);
    clearInterval(tickIntervalRef.current);
    try {
      sessionRef.current?.stop();
    } catch {}
    sessionRef.current = null;
    setPhase(nextPhase);
    if (reason === "insufficient_velas") {
      setError("Suas Velas acabaram. A conversa foi encerrada. Adquira mais em /assinar. 🕯️");
    } else if (reason === "time_limit") {
      setError("Você atingiu o limite de 15 minutos desta conversa ao vivo.");
    }
  }

  async function handleStart() {
    setError(null);
    setPhase("connecting");
    try {
      const res = await fetch("/api/avatar-vivo/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError("Faça login para conversar ao vivo.");
        } else if (res.status === 403) {
          setError(data.error || "Recurso exclusivo dos planos Médio e Especial.");
        } else if (res.status === 402) {
          setError(data.error || "Velas insuficientes.");
        } else {
          setError(data.error || "Não foi possível iniciar a conversa.");
        }
        setPhase("idle");
        return;
      }

      sessionIdRef.current = data.sessionId;
      messagesRef.current = [];
      setTranscript([]);

      const { LiveAvatarSession } = await import("@heygen/liveavatar-web-sdk");
      const session = new LiveAvatarSession(data.heygenToken, { voiceChat: true });
      sessionRef.current = session;
      await session.start();
      if (videoRef.current) session.attach(videoRef.current);

      setPhase("live");
      setElapsed(0);
      clockIntervalRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
      tickIntervalRef.current = setInterval(async () => {
        try {
          const tickRes = await fetch("/api/avatar-vivo/tick", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sessionIdRef.current }),
          });
          const tickData = await tickRes.json();
          if (tickData.minutesBilled != null) {
            setBalance((b) =>
              b == null ? b : Math.max(0, b - PRECOS.avatarVivoPorMinuto)
            );
          }
          if (tickData.ended) {
            cleanupSession("ended", tickData.endReason);
          }
        } catch {
          // Falha de rede pontual — tenta de novo no próximo tick.
        }
      }, 60000);
    } catch (err) {
      console.error("[avatar-vivo]", err);
      setError("Não foi possível conectar ao avatar agora. Tente novamente.");
      setPhase("idle");
    }
  }

  async function handleEnd() {
    if (sessionIdRef.current) {
      fetch("/api/avatar-vivo/encerrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, reason: "user_ended" }),
      }).catch(() => {});
    }
    cleanupSession("ended", null);
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || sending || phase !== "live") return;
    setSending(true);
    setInput("");

    messagesRef.current = [...messagesRef.current, { role: "user", content: trimmed }];
    setTranscript((t) => [...t, { role: "user", content: trimmed }]);

    try {
      const res = await fetch("/api/avatar-vivo/falar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          characterId: character.id,
          messages: messagesRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setError(data.error || "Não foi possível obter a resposta agora.");
        return;
      }
      messagesRef.current = [...messagesRef.current, { role: "assistant", content: data.reply }];
      setTranscript((t) => [...t, { role: "assistant", content: data.reply }]);
      sessionRef.current?.repeat(data.reply);
    } catch {
      setError("Não foi possível obter a resposta agora.");
    } finally {
      setSending(false);
    }
  }

  const minutesRemainingByVelas =
    balance != null ? Math.floor(balance / PRECOS.avatarVivoPorMinuto) : null;
  const secondsRemaining = Math.max(0, MAX_MINUTES * 60 - elapsed);

  return (
    <div>
      <div className="avatar-vivo-head">
        {character.image && <img src={character.image} alt={character.name} />}
        <div>
          <h1>{character.name}</h1>
          <p>{character.title}</p>
        </div>
      </div>

      <div className="avatar-vivo-stage">
        <video ref={videoRef} autoPlay playsInline muted={false} />
        {phase !== "live" && (
          <div className="avatar-vivo-stage-idle">
            {character.image && <img src={character.image} alt="" />}
            <p>
              Converse ao vivo, por voz e vídeo, com {character.name}.
              <br />
              Custa {PRECOS.avatarVivoPorMinuto} Velas por minuto, até{" "}
              {MAX_MINUTES} minutos.
            </p>
          </div>
        )}
      </div>

      {error && <div className="avatar-vivo-error">{error}</div>}

      {phase === "live" && (
        <div className="avatar-vivo-status">
          <span>
            ⏱️ <strong>{formatClock(secondsRemaining)}</strong> restantes
          </span>
          {minutesRemainingByVelas != null && (
            <span>🕯️ {balance} Velas</span>
          )}
        </div>
      )}

      {transcript.length > 0 && (
        <div className="avatar-vivo-transcript">
          {transcript.map((m, i) => (
            <div key={i} className={`avatar-vivo-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
        </div>
      )}

      {phase === "live" ? (
        <>
          <div className="avatar-vivo-composer">
            <MicButton disabled={sending} onTranscript={(t) => sendMessage(t)} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(input);
              }}
              placeholder="Escreva sua pergunta…"
              disabled={sending}
            />
            <button
              type="button"
              className="btn btn-gold"
              disabled={sending || !input.trim()}
              onClick={() => sendMessage(input)}
            >
              Enviar
            </button>
          </div>
          <div className="avatar-vivo-actions">
            <button type="button" className="btn btn-ghost" onClick={handleEnd}>
              Encerrar conversa
            </button>
          </div>
        </>
      ) : (
        <div className="avatar-vivo-actions">
          <button
            type="button"
            className="btn btn-gold"
            disabled={phase === "connecting"}
            onClick={handleStart}
          >
            {phase === "connecting"
              ? "Conectando…"
              : phase === "ended"
              ? "Iniciar nova conversa"
              : "Iniciar conversa ao vivo"}
          </button>
          <Link href="/assinar" className="btn btn-ghost">
            Ver planos
          </Link>
        </div>
      )}
    </div>
  );
}
