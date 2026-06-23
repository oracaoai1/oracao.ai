import Link from "next/link";
import { TopBar, Footer } from "../components/SiteChrome";
import AuthForm from "../components/AuthForm";

export const metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Oração.AI para salvar conversas e favoritos.",
};

export default function CadastroPage() {
  return (
    <>
      <TopBar />
      <main className="auth-wrap">
        <div className="auth-card">
          <h1>Criar conta</h1>
          <p className="auth-sub">
            Salve suas conversas, favoritos e intenções de oração.
          </p>
          <AuthForm mode="cadastro" />
          <p className="auth-alt">
            Já tem conta? <Link href="/entrar">Entrar</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
