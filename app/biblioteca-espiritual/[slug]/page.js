// app/biblioteca-espiritual/[slug]/page.js
import '../../biblioteca-espiritual.css';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArtigoPorSlug, getAllSlugs, formatarData } from '@/lib/biblioteca';
import { TopBar, Footer } from '@/app/components/SiteChrome';
import AudioPlayerWrapper from '@/app/components/AudioPlayerWrapper';

export async function generateMetadata({ params }) {
  const artigo = await getArtigoPorSlug(params.slug);
  if (!artigo) return { title: 'Texto não encontrado' };
  return {
    title: artigo.titulo,
    description: artigo.descricao,
    openGraph: {
      title: artigo.titulo, description: artigo.descricao,
      url: `https://www.oracao.ai/biblioteca-espiritual/${artigo.slug}`,
      type: 'article', publishedTime: artigo.publicado_em,
    },
    alternates: { canonical: `https://www.oracao.ai/biblioteca-espiritual/${artigo.slug}` },
  };
}

export async function generateStaticParams() { return getAllSlugs(); }

function renderConteudo(texto) {
  const els = [];
  texto.split('\n').forEach((linha, i) => {
    linha = linha.trim();
    if (!linha) return;
    if (linha.startsWith('**') && linha.endsWith('**')) {
      els.push(<h3 key={i} className="artigo-secao">{linha.slice(2,-2)}</h3>);
      return;
    }
    const partes = linha.split(/(\*\*[^*]+\*\*)/g);
    const inline = partes.map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j} style={{color:'var(--gold)',fontWeight:700}}>{p.slice(2,-2)}</strong>
        : p
    );
    const ehVerso = linha.length < 120 && !linha.startsWith('**') && !/[.?!:]$/.test(linha);
    els.push(<p key={i} className={ehVerso ? 'artigo-verso' : ''}>{inline}</p>);
  });
  return els;
}

export default async function ArtigoPage({ params }) {
  const artigo = await getArtigoPorSlug(params.slug);
  if (!artigo) notFound();
  const textoAudio = artigo.conteudo.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\n{2,}/g,'\n').trim();

  return (
    <>
      <TopBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        '@context':'https://schema.org','@type':'Article',
        headline: artigo.titulo, description: artigo.descricao,
        datePublished: artigo.publicado_em,
        publisher:{'@type':'Organization',name:'Oração.AI',url:'https://www.oracao.ai'},
        url:`https://www.oracao.ai/biblioteca-espiritual/${artigo.slug}`,
      })}}/>
      <div className="artigo-page-wrap">
        <nav className="artigo-breadcrumb">
          <Link href="/">Início</Link>
          <span className="artigo-breadcrumb-sep">›</span>
          <Link href="/biblioteca-espiritual">Biblioteca Espiritual</Link>
          <span className="artigo-breadcrumb-sep">›</span>
          <span style={{opacity:.7}}>{artigo.titulo}</span>
        </nav>
        <header className="artigo-header">
          <div><span className="artigo-categoria-badge">{artigo.categoria}</span></div>
          <div className="artigo-titulo-wrap">
            <span className="artigo-inicial">{artigo.titulo[0]}</span>
            <h1 className="artigo-h1">{artigo.titulo.slice(1)}</h1>
          </div>
          <p className="artigo-desc-header">{artigo.descricao}</p>
          <p className="artigo-meta-date">Publicado em {formatarData(artigo.publicado_em)}</p>
          <div className="artigo-divisor">
            <div className="artigo-divisor-linha"/>
            <span className="artigo-divisor-ornato">✦</span>
            <div className="artigo-divisor-linha"/>
          </div>
          <div className="artigo-audio">
            <AudioPlayerWrapper text={textoAudio} label="Ouvir esta oração" />
          </div>
        </header>
        <article className="artigo-body">{renderConteudo(artigo.conteudo)}</article>
        <div style={{textAlign:'center'}}>
          <Link href="/biblioteca-espiritual" className="artigo-voltar">
            ← Toda a Biblioteca Espiritual
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
