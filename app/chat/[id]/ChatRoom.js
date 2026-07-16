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
import FavoriteHeart from "@/app/components/FavoriteHeart";
import { getFavoriteIds, addFavorite, removeFavorite } from "@/lib/favorites";
import MessageAudioButton from "@/app/components/MessageAudioButton";
import MessageImageButton from "@/app/components/MessageImageButton";
import ScenesPanel from "@/app/components/ScenesPanel";
import MicButton from "@/app/components/MicButton";

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
  const [isFav, setIsFav] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [scenesOpen, setScenesOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const autoPlayRef = useRef(false);
  const conversationIdRef = useRef(null);

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
        try {
          const favIds = await getFavoriteIds(supabase);
          if (active) setIsFav(favIds.includes(character.id));
        } catch {
          /* favoritos indisponíveis — ignora */
        }
      }
      if (active) setHistoryLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, character.id]);

  // Preferência de auto-narração (persistida no navegador).
  useEffect(() => {
    try {
      const v = localStorage.getItem("oracao-autoplay") === "1";
      setAutoPlay(v);
      autoPlayRef.current = v;
    } catch {}
  }, []);

  // Respeita "reduzir movimento" do sistema: não reproduz o vídeo de fundo
  // em autoplay para quem ativou essa preferência de acessibilidade.
  useEffect(() => {
    try {
      setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {}
  }, []);

  function toggleAutoPlay() {
    setAutoPlay((prev) => {
      const next = !prev;
      autoPlayRef.current = next;
      try {
        localStorage.setItem("oracao-autoplay", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

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
      setMessages((m) => [
        ...m,
        { role: "assistant", content: reply, auto: autoPlayRef.current },
      ]);
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

  async function toggleFavorite() {
    const was = isFav;
    setIsFav(!was); // otimista
    try {
      if (was) await removeFavorite(supabase, character.id);
      else await addFavorite(supabase, character.id);
    } catch {
      setIsFav(was); // reverte
    }
  }

  const showSuggestions =
    !historyLoading && messages.length === 0 && !loading;

  return (
    <div className={`chat-page ${character.loopVideo ? "has-bg-video" : ""}`}>
      {character.loopVideo && (
        <video
          className="chat-bg-video"
          src={character.loopVideo}
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      )}
      <ScenesPanel
        characterId={character.id}
        characterName={character.name}
        open={scenesOpen}
        onClose={() => setScenesOpen(false)}
      />
      <header className="chat-header">
        <div className="container chat-header-inner">
          <Link href="/#personagens" className="back">
            ← Voltar
          </Link>
          <div className="who">
            <Avatar character={character} />
            <div className="who-text">
              <h2>{character.name}</h2>
              <div className="role">
                {[character.title, character.era].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
          <div className="chat-actions">
            {user && (
              <>
                <FavoriteHeart
                  active={isFav}
                  onToggle={toggleFavorite}
                  className="chat-fav"
                />
                {messages.length > 0 && (
                  <button className="new-chat" onClick={newConversation}>
                    ＋ Nova conversa
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {character.loopVideo && <div className="chat-video-space" aria-hidden="true" />}
      <div className="chat-scroll">
        <div className="container">
          <div className="chat-stack">
            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} className="msg assistant">
                  <Avatar character={character} className="mini-avatar" />
                  <div className="bubble-col">
                    <div className="bubble">{m.content}</div>
                    <div className="msg-actions">
                      {user && (
                        <MessageImageButton
                          characterId={character.id}
                          text={m.content}
                          conversationId={conversationIdRef.current}
                        />
                      )}
                      <MessageAudioButton
                        text={m.content}
                        characterId={character.id}
                        autoStart={m.auto}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div key={i} className="msg user">
                  <div className="bubble">{m.content}</div>
                </div>
              )
            )}
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
          {showSuggestions && (
            <div className="msg assistant greeting--composer">
              <Avatar character={character} className="mini-avatar" />
              <div className="bubble-col">
                <div className="bubble">{greeting}</div>
                <MessageAudioButton text={greeting} characterId={character.id} />
              </div>
            </div>
          )}
          <div className="composer-toolbar">
            <button
              type="button"
              className={`autoplay-toggle ${autoPlay ? "is-on" : ""}`}
              onClick={toggleAutoPlay}
              aria-pressed={autoPlay}
              title="Narrar automaticamente as respostas com a voz do personagem"
            >
              {autoPlay ? "🔊" : "🔇"} Auto-narração
            </button>
            <button
              type="button"
              className="scenes-btn"
              onClick={() => setScenesOpen(true)}
              title="Ver cenas em vídeo deste santo"
            >
              🎬 Cenas
            </button>
          </div>
          <div className="composer-inner">
            <MicButton
              disabled={loading}
              onTranscript={(t) => {
                setInput((prev) => (prev ? prev.trim() + " " : "") + t);
                requestAnimationFrame(autoGrow);
                textareaRef.current?.focus();
              }}
            />
            <textarea
              ref={textareaRef}
              value={input}
              placeholder={`Escreva ou fale sua mensagem para ${character.name.split(" ")[0]}...`}
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
