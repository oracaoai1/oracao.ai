"use client";

// Botão de coração para favoritar. Quando usado dentro de um <Link> (cartão),
// previne a navegação ao clicar. `active` = já é favorito; `onToggle` recebe
// o evento e decide (incluindo redirecionar para login se deslogado).
export default function FavoriteHeart({ active, onToggle, className = "" }) {
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    onToggle(e);
  }

  return (
    <button
      type="button"
      className={`fav-heart ${active ? "is-active" : ""} ${className}`}
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
