// app/biblioteca-espiritual/page.js
import '../biblioteca-espiritual.css';
import { getAllArtigos, getCategorias } from '@/lib/biblioteca';
import ArtigoCard from '@/app/components/ArtigoCard';
import { TopBar, Footer } from '@/app/components/SiteChrome';
import Link from 'next/link';

export const metadata = {
  title: 'Biblioteca Espiritual — Orações, Salmos e Reflexões',
  description:
    'Acervo de orações tradicionais, salmos e reflexões cristãs em português, com narração em áudio.',
};

export default async function BibliotecaPage({ searchParams }) {
  // Next.js 15: searchParams é uma Promise
  const sp = await searchParams;
  const catAtiva = sp?.categoria ?? 'Todas';

  const [artigos, categorias] = await Promise.all([getAllArtigos(), getCategorias()]);

  const filtrados =
    catAtiva === 'Todas' ? artigos : artigos.filter((a) => a.categoria === catAtiva);

  return (
    <>
      <TopBar />
      <section className="hero">
        <div className="container">
          <p className="eyebrow">Oração.AI</p>
          <h1>Biblioteca Espiritual</h1>
          <p>
            Orações, salmos e reflexões da tradição cristã,
            <br />
            com narração em áudio para cada texto.
          </p>
          <nav className="cat-nav" aria-label="Filtrar por categoria">
            {['Todas', ...categorias].map((cat) => (
              <Link
                key={cat}
                href={
                  cat === 'Todas'
                    ? '/biblioteca-espiritual'
                    : `/biblioteca-espiritual?categoria=${encodeURIComponent(cat)}`
                }
                className={`cat-pill${cat === catAtiva ? ' is-active' : ''}`}
              >
                {cat}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {filtrados.length === 0 ? (
            <p className="empty-state">Nenhum texto encontrado nesta categoria.</p>
          ) : (
            <div className="biblioteca-grid">
              {filtrados.map((artigo) => (
                <ArtigoCard key={artigo.slug} artigo={artigo} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
