import Link from "next/link";
import FavoriteHeart from "./FavoriteHeart";

export function initials(name) {
  // Pega as iniciais do primeiro nome próprio após títulos como "São"/"Santa".
  const parts = name.replace(/^(São|Santo|Santa|Nossa Senhora)\s+/i, "").split(" ");
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export function Avatar({ character, className = "avatar" }) {
  if (character.image) {
    return (
      <img
        src={character.image}
        alt={character.name}
        className={`${className} avatar-img`}
      />
    );
  }
  return (
    <div className={className} style={{ background: character.accent }}>
      {initials(character.name)}
    </div>
  );
}

export default function CharacterCard({
  character,
  isFavorite = false,
  onToggleFavorite,
}) {
  return (
    <Link href={`/chat/${character.id}`} className="card">
      {onToggleFavorite && (
        <FavoriteHeart
          active={isFavorite}
          onToggle={() => onToggleFavorite(character.id)}
        />
      )}
      <Avatar character={character} />
      <div className="cat">{character.category}</div>
      <h3>{character.name}</h3>
      {character.title && <div className="role">{character.title}</div>}
      {character.short && <p className="desc">{character.short}</p>}
      <div className="meta">
        <span>{character.era || "Tradição da Igreja"}</span>
        {character.feast && <span>Festa: {character.feast}</span>}
      </div>
      <span className="card-cta">Conversar →</span>
    </Link>
  );
}
