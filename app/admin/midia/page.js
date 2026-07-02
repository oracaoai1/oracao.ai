import { TopBar, Footer } from "../../components/SiteChrome";
import MediaStudio from "./MediaStudio";
import { characters } from "@/lib/characters";

export const metadata = {
  title: "Estúdio de Mídia",
  robots: { index: false, follow: false },
};

export default function MidiaPage() {
  const chars = characters.map((c) => ({ id: c.id, name: c.name }));
  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h1>Estúdio de Mídia</h1>
          <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>
            Crie cenas em vídeo dos santos (foto + voz ElevenLabs + HeyGen),
            revise e publique no catálogo com preço em Velas.
          </p>
          <MediaStudio characters={chars} />
        </div>
      </section>
      <Footer />
    </>
  );
}
