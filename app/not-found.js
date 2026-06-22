import Link from "next/link";
import { TopBar, Footer } from "./components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <h1>Página não encontrada</h1>
          <p style={{ color: "var(--ink-soft)", maxWidth: "50ch", margin: "0 auto 28px" }}>
            O caminho que você procura não existe. Que tal voltar e escolher um
            personagem para conversar?
          </p>
          <Link href="/" className="btn btn-gold">
            Voltar ao início
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
