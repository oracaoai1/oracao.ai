import Link from "next/link";
import { characters } from "@/lib/characters";
import CharacterCard from "./components/CharacterCard";
import { TopBar, Footer } from "./components/SiteChrome";

export default function HomePage() {
  return (
    <>
      <TopBar />

      <section className="hero">
        <div className="container">
          <p className="eyebrow">Inteligência artificial a serviço da fé</p>
          <h1>Converse com as grandes figuras da Igreja</h1>
          <p>
            Santos, papas e doutores da Igreja Católica recriados por
            inteligência artificial. Faça suas perguntas, aprofunde sua fé e
            aprenda com quem trilhou o caminho da santidade.
          </p>
          <div className="hero-actions">
            <Link href="#personagens" className="btn btn-gold">
              Escolher um personagem
            </Link>
            <Link href="#como-funciona" className="btn btn-ghost">
              Como funciona
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="personagens">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Nossos personagens</p>
            <h2>Com quem você gostaria de conversar?</h2>
            <p>
              Cada personagem responde com a voz, a história e a espiritualidade
              da figura que representa, fundamentado em seus escritos e na
              doutrina católica.
            </p>
          </div>
          <div className="grid">
            {characters.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        </div>
      </section>

      <section className="section alt-bg" id="como-funciona">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Como funciona</p>
            <h2>Simples como uma conversa</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num">1</div>
              <h3>Escolha</h3>
              <p>
                Selecione um santo, papa ou doutor da Igreja entre os
                personagens disponíveis.
              </p>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h3>Pergunte</h3>
              <p>
                Faça suas dúvidas sobre fé, oração, sofrimento ou a vida do
                personagem — como num diálogo.
              </p>
            </div>
            <div className="step">
              <div className="num">3</div>
              <h3>Aprofunde</h3>
              <p>
                Receba respostas inspiradas em fontes históricas e cresça na
                compreensão da fé católica.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
