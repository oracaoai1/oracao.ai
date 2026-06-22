import Link from "next/link";
import { TopBar, Footer } from "../components/SiteChrome";

export const metadata = {
  title: "Sobre",
  description:
    "Conheça o propósito da plataforma Oração.AI e como usamos a inteligência artificial com responsabilidade.",
};

export default function SobrePage() {
  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container" style={{ maxWidth: 740 }}>
          <p className="eyebrow" style={{ color: "var(--gold)", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", fontSize: "0.74rem" }}>
            Sobre a plataforma
          </p>
          <h1>Fé e tecnologia, lado a lado</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--ink-soft)" }}>
            O <strong>Oração.AI</strong> nasceu para aproximar as pessoas da
            riqueza espiritual e intelectual da Igreja Católica. Recriamos
            grandes figuras da história cristã — santos, papas, místicos e
            doutores — como personagens de inteligência artificial com quem você
            pode conversar.
          </p>

          <h2 style={{ marginTop: 40 }}>Nosso propósito</h2>
          <p style={{ color: "var(--ink-soft)" }}>
            Acreditamos que a sabedoria dos santos pode iluminar as perguntas de
            hoje. Cada personagem foi construído a partir de seus escritos, de
            sua biografia e da doutrina da Igreja, para oferecer respostas
            fiéis, calorosas e acessíveis.
          </p>

          <h2 style={{ marginTop: 40 }}>Uso responsável da IA</h2>
          <p style={{ color: "var(--ink-soft)" }}>
            As respostas são <strong>geradas por inteligência artificial</strong>{" "}
            e representam uma recriação respeitosa, não a pessoa real. Por mais
            cuidadosa que seja, a IA pode cometer erros. Por isso, estas
            conversas não substituem o magistério da Igreja, a leitura das
            Sagradas Escrituras, os sacramentos nem o acompanhamento de um
            sacerdote ou diretor espiritual. Use a plataforma como um convite ao
            estudo, à oração e ao aprofundamento da fé.
          </p>

          <div style={{ marginTop: 44 }}>
            <Link href="/#personagens" className="btn btn-gold">
              Começar uma conversa
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
