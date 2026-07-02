import { TopBar, Footer } from "../../components/SiteChrome";
import VoiceStudio from "./VoiceStudio";
import { characters } from "@/lib/characters";

export const metadata = {
  title: "Estúdio de Vozes",
  robots: { index: false, follow: false },
};

export default function VozesPage() {
  const chars = characters.map((c) => ({ id: c.id, name: c.name }));
  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
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
            Administração
          </p>
          <h1>Estúdio de Vozes</h1>
          <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>
            Defina a voz de cada santo e ajuste estabilidade, semelhança, estilo
            e velocidade. Ouça a prévia antes de salvar. As mudanças valem para
            o site inteiro.
          </p>
          <VoiceStudio characters={chars} />
        </div>
      </section>
      <Footer />
    </>
  );
}
