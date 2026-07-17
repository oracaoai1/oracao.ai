import Link from "next/link";

// Seção da home que anuncia o Avatar ao Vivo (HeyGen). Server component —
// `hasAccess` já vem calculado do servidor (assinatura ativa Médio/Especial).
export default function LiveAvatarSection({ characters, hasAccess }) {
  if (!characters.length) return null;

  return (
    <section className="section alt-bg" id="avatar-vivo">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Novidade</p>
          <h2>Converse ao vivo com um avatar</h2>
          <p>
            Veja e ouça o personagem responder em tempo real, com voz e
            expressão — não é apenas texto. Exclusivo dos planos Médio e
            Especial, por 2 Velas a cada minuto de conversa.
          </p>
        </div>
        <div className="live-avatar-grid">
          {characters.map((c) => (
            <Link
              key={c.id}
              href={`/avatar-vivo/${c.id}`}
              className="live-avatar-card"
            >
              <span className="live-avatar-badge">🎥 Ao vivo</span>
              {c.image ? (
                <img src={c.image} alt={c.name} />
              ) : (
                <div
                  className="card-media-fallback"
                  style={{ background: c.accent }}
                />
              )}
              <div className="live-avatar-info">
                <h3>{c.name}</h3>
                <p>{c.title}</p>
              </div>
            </Link>
          ))}
        </div>
        {!hasAccess && (
          <p className="live-avatar-cta">
            Recurso exclusivo dos planos Médio e Especial —{" "}
            <Link href="/assinar" className="link-gold">
              assine para desbloquear
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
