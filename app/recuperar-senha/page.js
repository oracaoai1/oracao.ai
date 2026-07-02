import Link from "next/link";
import { TopBar, Footer } from "../components/SiteChrome";
import RecuperarClient from "./RecuperarClient";

export const metadata = {
  title: "Recuperar senha",
  description: "Receba um link para criar uma nova senha no Oração.AI.",
};

export default function RecuperarPage() {
  return (
    <>
      <TopBar />
      <main className="auth-wrap">
        <div className="auth-card">
          <h1>Recuperar senha</h1>
          <p className="auth-sub">
            Informe o e-mail da sua conta e enviaremos um link para criar uma
            nova senha.
          </p>
          <RecuperarClient />
          <p className="auth-alt">
            Lembrou? <Link href="/entrar">Voltar para entrar</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
