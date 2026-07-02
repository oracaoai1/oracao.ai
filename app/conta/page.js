import { TopBar, Footer } from "../components/SiteChrome";
import ContaClient from "./ContaClient";

export const metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};

export default function ContaPage() {
  return (
    <>
      <TopBar />
      <main className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          <h1>Minha conta</h1>
          <p className="auth-sub">
            Atualize seu nome de exibição ou defina uma nova senha.
          </p>
          <ContaClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
