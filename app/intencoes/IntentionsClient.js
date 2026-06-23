"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getIntentions,
  addIntention,
  setAnswered,
  deleteIntention,
} from "@/lib/intentions";

export default function IntentionsClient({ characters }) {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [body, setBody] = useState("");
  const [charId, setCharId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Mapa id -> nome para mostrar o santo associado em cada intenção.
  const nameById = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c.name])),
    [characters]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user ?? null);
      if (user) {
        const data = await getIntentions(supabase);
        if (active) setItems(data);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function onSubmit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || saving) return;
    setSaving(true);
    setError("");
    try {
      const row = await addIntention(supabase, { body: text, characterId: charId });
      setItems((prev) => [row, ...prev]);
      setBody("");
      setCharId("");
    } catch {
      setError("Não foi possível salvar a intenção. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item) {
    const next = !item.answered;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, answered: next } : i))
    );
    try {
      await setAnswered(supabase, item.id, next);
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, answered: !next } : i))
      );
    }
  }

  async function remove(item) {
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== item.id));
    try {
      await deleteIntention(supabase, item.id);
    } catch {
      setItems(prev); // reverte
    }
  }

  if (loading) {
    return <p className="intention-muted">Carregando…</p>;
  }

  if (!user) {
    return (
      <div className="intention-gate">
        <p>
          <Link href="/entrar">Entre</Link> ou{" "}
          <Link href="/cadastro">crie uma conta</Link> para registrar e
          acompanhar suas intenções de oração.
        </p>
      </div>
    );
  }

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <>
      <form className="intention-form" onSubmit={onSubmit}>
        {error && <div className="auth-msg error">{error}</div>}
        <div className="field">
          <label htmlFor="body">Sua intenção</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Pelo que deseja orar? Ex.: pela saúde da minha mãe…"
            rows={3}
            maxLength={1000}
          />
        </div>
        <div className="intention-row">
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="char">Pedir a intercessão de (opcional)</label>
            <select
              id="char"
              value={charId}
              onChange={(e) => setCharId(e.target.value)}
            >
              <option value="">Nenhum / intenção geral</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-gold" type="submit" disabled={saving || !body.trim()}>
            {saving ? "Salvando…" : "Adicionar intenção"}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="intention-muted">
          Você ainda não registrou nenhuma intenção. Escreva a primeira acima.
        </p>
      ) : (
        <ul className="intention-list">
          {items.map((it) => (
            <li
              key={it.id}
              className={`intention ${it.answered ? "is-answered" : ""}`}
            >
              <div className="intention-main">
                <p className="intention-body">{it.body}</p>
                <div className="intention-meta">
                  <span>{fmt(it.created_at)}</span>
                  {it.character_id && nameById[it.character_id] && (
                    <span>· intercessão de {nameById[it.character_id]}</span>
                  )}
                  {it.answered && <span className="badge-answered">Atendida 🙏</span>}
                </div>
              </div>
              <div className="intention-actions">
                <button
                  className="link-btn"
                  onClick={() => toggle(it)}
                  title={it.answered ? "Marcar como em oração" : "Marcar como atendida"}
                >
                  {it.answered ? "Reabrir" : "Atendida"}
                </button>
                <button
                  className="link-btn danger"
                  onClick={() => remove(it)}
                  title="Excluir"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
