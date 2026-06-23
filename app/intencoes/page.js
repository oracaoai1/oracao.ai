import { TopBar, Footer } from "../components/SiteChrome";
import IntentionsClient from "./IntentionsClient";
import { characters } from "@/lib/characters";

export const metadata = {
  title: "Intenções de oração",
  description:
    "Registre e acompanhe suas intenções de oração, com a intercessão das figuras da Igreja.",
};

export default function IntencoesPage() {
  // Passa só id e nome para o seletor de santo (não o objeto inteiro).
  const options = characters.map((c) => ({ id: c.id, name: c.name }));
  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <p
            className="eyebrow"
            style={{
              color: "var(--gold)",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontSize: "0.74rem",
            }}
          >
            Vida de oração
          </p>
          <h1>Intenções de oração</h1>
          <p style={{ color: "var(--ink-soft)", marginBottom: 28 }}>
            Registre seus pedidos, confie-os à intercessão dos santos e marque
            como atendidos quando o Senhor responder.
          </p>
          <IntentionsClient characters={options} />
        </div>
      </section>
      <Footer />
    </>
  );
}
