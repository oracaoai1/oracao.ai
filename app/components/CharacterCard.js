import Link from "next/link";

function initials(name) {
  // Pega as iniciais do primeiro nome próprio após títulos como "São"/"Santa".
  const parts = name.replace(/^(São|Santo|Santa)\s+/i, "").split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export default function CharacterCard({ character }) {
  return (
    <Link href={`/chat/${character.id}`} className="card">
      <div className="avatar" style={{ background: character.accent }}>
        {initials(character.name)}
      </div>
      <div className="cat">{character.category}</div>
      <h3>{character.name}</h3>
      <div className="role">{character.title}</div>
      <p className="desc">{character.short}</p>
      <div className="meta">
        <span>{character.era}</span>
        <span>Festa: {character.feast}</span>
      </div>
      <span className="card-cta">Conversar →</span>
    </Link>
  );
}
