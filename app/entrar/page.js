import Link from "next/link";
import { TopBar, Footer } from "../components/SiteChrome";
import AuthForm from "../components/AuthForm";

export const metadata = {
  title: "Entrar",
  description: "Acesse sua conta no Oração.AI.",
};

const ERROS = {
  confirmacao:
    "Não foi possível confirmar seu e-mail. O link pode ter expirado — tente entrar ou peça um novo link.",
};

export default async function EntrarPage({ searchParams }) {
  const sp = await searchParams;
  const erro = ERROS[sp?.erro] || "";

  return (
    <>
      <TopBar />
      <main className="auth-wrap">
        <div className="auth-card">
          <h1>Bem-vindo de volta</h1>
          <p className="auth-sub">
            Entre para retomar suas conversas e intenções de oração.
          </p>
          {erro && <div className="auth-msg error">{erro}</div>}
          <AuthForm mode="entrar" />
          <p className="auth-alt">
            Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
