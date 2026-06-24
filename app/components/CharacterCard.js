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
      {character.image ? (
        <img
          src={character.image}
          alt={character.name}
          className="card-img"
          loading="lazy"
        />
      ) : (
        <div
          className="card-media-fallback"
          style={{ background: character.accent }}
        >
          {initials(character.name)}
        </div>
      )}
      {onToggleFavorite && (
        <FavoriteHeart
          active={isFavorite}
          onToggle={() => onToggleFavorite(character.id)}
        />
      )}
      <div className="card-overlay">
        <div className="cat">{character.category}</div>
        <h3>{character.name}</h3>
        {character.title && <p className="role">{character.title}</p>}
        {character.era && <p className="card-era">{character.era}</p>}
      </div>
    </Link>
  );
}
