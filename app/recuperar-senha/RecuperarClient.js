"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarClient() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/conta`,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setError("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-msg ok">
        Se existe uma conta com esse e-mail, enviamos um link para você criar
        uma nova senha. Verifique sua caixa de entrada (e o spam).
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {error && <div className="auth-msg error">{error}</div>}
      <div className="field">
        <label htmlFor="email">E-mail da conta</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
        />
      </div>
      <button className="btn btn-gold" type="submit" disabled={loading}>
        {loading ? "Enviando…" : "Enviar link de redefinição"}
      </button>
    </form>
  );
}
