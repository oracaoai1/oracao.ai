import Link from "next/link";
import { TopBar, Footer } from "../components/SiteChrome";
import { characters, getCategories } from "@/lib/characters";
import { getAllArtigos, getCategorias } from "@/lib/biblioteca";

export const metadata = {
  title: "Mapa do site",
  description: "Todas as seções, personagens e textos do Oração.AI em um só lugar.",
};

export default async function MapaDoSitePage() {
  const categorias = getCategories();
  const artigos = await getAllArtigos();
  const categoriasBiblioteca = await getCategorias();

  return (
    <>
      <TopBar />
      <section className="section">
        <div className="container legal-page sitemap-page" style={{ maxWidth: 780 }}>
          <h1>Mapa do site</h1>
          <p>Todas as páginas do Oração.AI, organizadas por seção.</p>

          <dl>
            <dt>Principal</dt>
            <dd className="sitemap-grid">
              <Link href="/">Início</Link>
              <Link href="/sobre">Sobre</Link>
              <Link href="/#como-funciona">Como funciona</Link>
              <Link href="/assinar">Assinar</Link>
            </dd>

            <dt>Personagens</dt>
            <dd className="sitemap-grid">
              {categorias.map((cat) => (
                <span key={cat}>{cat}</span>
              ))}
            </dd>
            {categorias.map((cat) => (
              <dd className="sitemap-grid" key={cat}>
                {characters
                  .filter((c) => c.category === cat)
                  .map((c) => (
                    <Link key={c.id} href={`/chat/${c.id}`}>
                      {c.name}
                    </Link>
                  ))}
              </dd>
            ))}

            <dt>Biblioteca Católica</dt>
            <dd className="sitemap-grid">
              <Link href="/biblioteca-catolica">Todos os textos</Link>
            </dd>
            {categoriasBiblioteca.map((cat) => (
              <dd className="sitemap-grid" key={cat}>
                {artigos
                  .filter((a) => a.categoria === cat)
                  .map((a) => (
                    <Link key={a.slug} href={`/biblioteca-catolica/${a.slug}`}>
                      {a.titulo}
                    </Link>
                  ))}
              </dd>
            ))}

            <dt>Sua conta</dt>
            <dd className="sitemap-grid">
              <Link href="/entrar">Entrar</Link>
              <Link href="/cadastro">Criar conta</Link>
              <Link href="/conta">Minha conta</Link>
              <Link href="/intencoes">Intenções de oração</Link>
              <Link href="/recuperar-senha">Recuperar senha</Link>
            </dd>

            <dt>Legal</dt>
            <dd className="sitemap-grid">
              <Link href="/termos-de-uso">Termos de Uso</Link>
              <Link href="/politica-de-privacidade">Política de Privacidade</Link>
              <Link href="/mapa-do-site">Mapa do site</Link>
            </dd>
          </dl>
        </div>
      </section>
      <Footer />
    </>
  );
}
