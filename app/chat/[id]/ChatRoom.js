"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function initials(name) {
  const parts = name.replace(/^(São|Santo|Santa)\s+/i, "").split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export default function ChatRoom({ character }) {
  const greeting = `A paz esteja contigo! Sou ${character.name}. Sobre o que gostaria de conversar?`;
  const [messages, setMessages] = useState([
    { role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  function autoGrow() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setError("");
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          // Não envia a saudação inicial (não é parte do diálogo real).
          messages: next.slice(1),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao conversar.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="container chat-header-inner">
          <Link href="/#personagens" className="back">
            ← Voltar
          </Link>
          <div className="who">
            <div className="avatar" style={{ background: character.accent }}>
              {initials(character.name)}
            </div>
            <div>
              <h2>{character.name}</h2>
              <div className="role">
                {character.title} · {character.era}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="container">
          <div className="chat-stack">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.role === "assistant" && (
                  <div
                    className="mini-avatar"
                    style={{ background: character.accent }}
                  >
                    {initials(character.name)}
                  </div>
                )}
                <div className="bubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="msg assistant">
                <div
                  className="mini-avatar"
                  style={{ background: character.accent }}
                >
                  {initials(character.name)}
                </div>
                <div className="bubble">
                  <span className="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {showSuggestions && (
            <div className="suggestions">
              {character.questions.map((q) => (
                <button
                  key={q}
                  className="chip"
                  onClick={() => send(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="composer">
        <div className="container">
          {error && <div className="error-banner">{error}</div>}
          <div className="composer-inner">
            <textarea
              ref={textareaRef}
              value={input}
              placeholder={`Escreva sua mensagem para ${character.name.split(" ")[0]}...`}
              rows={1}
              onChange={(e) => {
                setInput(e.target.value);
                autoGrow();
              }}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <button
              className="send"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Enviar"
            >
              ➤
            </button>
          </div>
          <p className="chat-note">
            Respostas geradas por IA com base em fontes históricas. Podem conter
            imprecisões.
          </p>
        </div>
      </div>
    </div>
  );
}
