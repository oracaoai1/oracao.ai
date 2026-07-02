"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordField from "./PasswordField";

// Formulário compartilhado de autenticação por e-mail/senha.
// mode: "entrar" (login) | "cadastro" (criar conta).
export default function AuthForm({ mode }) {
  const isSignup = mode === "cadastro";
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name.trim() || null },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;

        // Com confirmação de e-mail ativada, ainda não há sessão.
        if (!data.session) {
          setNotice(
            "Conta criada! Enviamos um link de confirmação para o seu e-mail. " +
              "Confirme para entrar."
          );
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      // Sessão ativa: atualiza os Server Components e volta para a home.
      router.refresh();
      router.push("/");
    } catch (err) {
      setError(traduzErro(err?.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {error && <div className="auth-msg error">{error}</div>}
      {notice && <div className="auth-msg ok">{notice}</div>}

      {isSignup && (
        <div className="field">
          <label htmlFor="name">Nome (como quer ser chamado)</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Maria"
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="email">E-mail</label>
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

      <PasswordField
        id="password"
        label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        autoComplete={isSignup ? "new-password" : "current-password"}
        placeholder={isSignup ? "Mínimo de 6 caracteres" : "Sua senha"}
      />

      {!isSignup && (
        <div className="auth-forgot">
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
        </div>
      )}

      <button className="btn btn-gold" type="submit" disabled={loading}>
        {loading
          ? "Aguarde…"
          : isSignup
            ? "Criar conta"
            : "Entrar"}
      </button>
    </form>
  );
}

// Mensagens da API do Supabase chegam em inglês; traduzimos as mais comuns.
function traduzErro(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (m.includes("user already registered"))
    return "Já existe uma conta com este e-mail. Tente entrar.";
  if (m.includes("password should be"))
    return "A senha deve ter ao menos 6 caracteres.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (m.includes("unable to validate email"))
    return "E-mail inválido.";
  return msg || "Não foi possível concluir. Tente novamente.";
}
