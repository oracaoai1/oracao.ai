import Link from "next/link";
import { TopBar, Footer } from "../components/SiteChrome";
import AuthForm from "../components/AuthForm";

export const metadata = {
  title: "Entrar",
  description: "Acesse sua conta no Oração.AI.",
};

export default function EntrarPage() {
  return (
    <>
      <TopBar />
      <main className="auth-wrap">
        <div className="auth-card">
          <h1>Bem-vindo de volta</h1>
          <p className="auth-sub">
            Entre para retomar suas conversas e intenções de oração.
          </p>
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
