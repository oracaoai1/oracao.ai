import Link from "next/link";
import { characters, getCategories, getCharacter } from "@/lib/characters";
import CharacterGallery from "./components/CharacterGallery";
import LiveAvatarSection from "./components/LiveAvatarSection";
import { TopBar, Footer } from "./components/SiteChrome";
import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/subscription";
import { TIERS } from "@/lib/plans";
import { getLiveAvatarCharacterIds } from "@/lib/liveAvatar";

// Apenas os campos de exibição (sem o `raw` da base) vão para o cliente.
function toDisplay(c) {
  return {
    id: c.id,
    name: c.name,
    title: c.title,
    category: c.category,
    era: c.era,
    feast: c.feast,
    image: c.image,
    accent: c.accent,
    short: c.short,
  };
}

export default async function HomePage() {
  const categories = getCategories();
  const display = characters.map(toDisplay);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const subscription = user ? await getActiveSubscription(supabase, user.id) : null;
  const hasLiveAvatarAccess = !!(
    subscription && TIERS[subscription.tier]?.liveAvatar
  );
  const liveAvatarCharacters = getLiveAvatarCharacterIds()
    .map((id) => getCharacter(id))
    .filter(Boolean)
    .map(toDisplay);

  return (
    <>
      <TopBar />

      <section className="hero">
        <div className="container">
          <p className="eyebrow">Inteligência artificial a serviço da fé</p>
          <h1>Converse com as grandes figuras da Igreja</h1>
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

      <LiveAvatarSection
        characters={liveAvatarCharacters}
        hasAccess={hasLiveAvatarAccess}
      />

      <section className="section" id="personagens">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">
              {characters.length} personagens disponíveis
            </p>
            <h2>Com quem você gostaria de conversar?</h2>
            <p>
              Cada personagem responde com a voz, a história e a espiritualidade
              da figura que representa, fundamentado em seus escritos, nas
              Escrituras e na doutrina católica.
            </p>
          </div>
          <CharacterGallery characters={display} categories={categories} />
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
                Selecione um santo, papa, doutor ou devoção entre os personagens
                disponíveis.
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
