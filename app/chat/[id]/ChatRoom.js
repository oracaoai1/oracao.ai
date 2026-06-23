"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/app/components/CharacterCard";
import { createClient } from "@/lib/supabase/client";
import {
  getLatestConversation,
  createConversation,
  saveExchange,
} from "@/lib/conversations";

export default function ChatRoom({ character }) {
  const greeting = `A paz esteja contigo! Sou ${character.name}. Sobre o que gostaria de conversar?`;

  // `messages` guarda APENAS o diálogo real (user/assistant). A saudação é
  // renderizada separadamente, fora do array — assim o histórico carregado do
  // Supabase não se mistura com ela e enviamos o contexto correto ao modelo.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado de autenticação / persistência.
  const [user, setUser] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const conversationIdRef = useRef(null);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  // Ao montar: descobre o usuário e, se logado, carrega a última conversa.
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user ?? null);

      if (user) {
        try {
          const conv = await getLatestConversation(supabase, character.id);
          if (active && conv) {
            conversationIdRef.current = conv.id;
            setMessages(conv.messages);
          }
        } catch {
          /* histórico indisponível — segue como conversa nova */
        }
      }
      if (active) setHistoryLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, character.id]);

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

    let reply;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          messages: next, // diálogo completo (sem a saudação) para contexto
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao conversar.");
      reply = data.reply;
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    // Persiste o par no Supabase (só para usuários logados). Falha aqui não
    // deve quebrar a conversa em andamento — apenas registra no console.
    if (user) {
      try {
        if (!conversationIdRef.current) {
          conversationIdRef.current = await createConversation(
            supabase,
            character.id,
            content
          );
        }
        await saveExchange(supabase, conversationIdRef.current, content, reply);
      } catch (err) {
        console.warn("Não foi possível salvar a conversa:", err.message);
      }
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function newConversation() {
    conversationIdRef.current = null;
    setMessages([]);
    setError("");
    setInput("");
  }

  const showSuggestions =
    !historyLoading && messages.length === 0 && !loading;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="container chat-header-inner">
          <Link href="/#personagens" className="back">
            ← Voltar
          </Link>
          <div className="who">
            <Avatar character={character} />
            <div>
              <h2>{character.name}</h2>
              <div className="role">
                {[character.title, character.era].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
          {user && messages.length > 0 && (
            <button className="new-chat" onClick={newConversation}>
              ＋ Nova conversa
            </button>
          )}
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="container">
          <div className="chat-stack">
            {/* Saudação fixa (não faz parte do diálogo persistido). */}
            <div className="msg assistant">
              <Avatar character={character} className="mini-avatar" />
              <div className="bubble">{greeting}</div>
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.role === "assistant" && (
                  <Avatar character={character} className="mini-avatar" />
                )}
                <div className="bubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="msg assistant">
                <Avatar character={character} className="mini-avatar" />
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
                <button key={q} className="chip" onClick={() => send(q)}>
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
          {!historyLoading && !user && messages.length > 0 && (
            <div className="save-hint">
              <Link href="/entrar">Entre</Link> ou{" "}
              <Link href="/cadastro">crie uma conta</Link> para salvar esta
              conversa.
            </div>
          )}
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
            {character.aviso ||
              "Respostas geradas por IA com base em fontes históricas. Podem conter imprecisões."}
          </p>
        </div>
      </div>
    </div>
  );
}
