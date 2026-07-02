"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PasswordField from "@/app/components/PasswordField";

export default function ContaClient() {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setName(data.user?.user_metadata?.display_name || "");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  async function saveName(e) {
    e.preventDefault();
    setNameMsg("");
    setNameSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name.trim() || null },
    });
    setNameSaving(false);
    setNameMsg(error ? "Não foi possível salvar." : "Nome atualizado.");
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");
    if (pw.length < 6) {
      setPwErr("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (pw !== pw2) {
      setPwErr("As senhas não coincidem.");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwSaving(false);
    if (error) {
      setPwErr(
        "Não foi possível alterar a senha. Entre novamente e tente de novo."
      );
      return;
    }
    setPw("");
    setPw2("");
    setPwMsg("Senha alterada com sucesso.");
  }

  if (loading) return <p className="intention-muted">Carregando…</p>;

  if (!user) {
    return (
      <div className="intention-gate">
        <p>
          <Link href="/entrar">Entre</Link> para acessar sua conta.
        </p>
      </div>
    );
  }

  return (
    <div className="conta">
      <p className="conta-email">
        Conta: <strong>{user.email}</strong>
      </p>

      <form className="auth-form" onSubmit={saveName}>
        <h2 className="conta-h2">Nome de exibição</h2>
        <div className="field">
          <label htmlFor="dn">Nome</label>
          <input
            id="dn"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como quer ser chamado"
          />
        </div>
        {nameMsg && <div className="auth-msg ok">{nameMsg}</div>}
        <button className="btn btn-gold" type="submit" disabled={nameSaving}>
          {nameSaving ? "Salvando…" : "Salvar nome"}
        </button>
      </form>

      <form className="auth-form" onSubmit={savePassword} style={{ marginTop: 30 }}>
        <h2 className="conta-h2">Alterar senha</h2>
        {pwErr && <div className="auth-msg error">{pwErr}</div>}
        {pwMsg && <div className="auth-msg ok">{pwMsg}</div>}
        <PasswordField
          id="np"
          label="Nova senha"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          placeholder="Mínimo de 6 caracteres"
        />
        <PasswordField
          id="np2"
          label="Confirmar nova senha"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          placeholder="Repita a nova senha"
        />
        <button className="btn btn-gold" type="submit" disabled={pwSaving}>
          {pwSaving ? "Salvando…" : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
