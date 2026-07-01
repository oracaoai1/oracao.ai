// app/components/ArtigoCard.js
import Link from 'next/link';

const BADGE_CORES = {
  'Oração Mariana':    { bg: '#f0e8f8', cor: '#7c4fa0' },
  'Reflexão':          { bg: '#e8f0f8', cor: '#2a5fa0' },
  'Oração dos Santos': { bg: '#fdf0e0', cor: '#a06020' },
  'Salmo':             { bg: '#e8f4ec', cor: '#2a7a44' },
  'Oração Litúrgica':  { bg: '#fdf5e0', cor: '#8a6e10' },
};

function getBadgeCor(cat) {
  return BADGE_CORES[cat] ?? { bg: '#f5eedc', cor: '#8a6e10' };
}

export default function ArtigoCard({ artigo }) {
  const { bg, cor } = getBadgeCor(artigo.categoria);
  const [d, m, a] = (artigo.publicado_em ?? '').split('-').reverse();
  const dataFmt = `${d}/${m}/${a}`;

  return (
    <Link href={`/biblioteca-espiritual/${artigo.slug}`} className="artigo-card-link">
      <article className="artigo-card">
        <span className="artigo-badge" style={{ background: bg, color: cor }}>
          {artigo.categoria}
        </span>
        <h2 className="artigo-titulo">{artigo.titulo}</h2>
        <p className="artigo-desc">{artigo.descricao}</p>
        <div className="artigo-rodape">
          <span className="artigo-data">{dataFmt}</span>
          <span className="artigo-ler">Ler →</span>
        </div>
      </article>
    </Link>
  );
}
