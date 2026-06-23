"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterCard from "./CharacterCard";
import { createClient } from "@/lib/supabase/client";
import {
  getFavoriteIds,
  addFavorite,
  removeFavorite,
} from "@/lib/favorites";

const FAVORITES = "★ Favoritos";

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function CharacterGallery({ characters, categories }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("Todos");

  // Favoritos (Set de character_id) + estado de login.
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(() => new Set());
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user ?? null);
      if (user) {
        const ids = await getFavoriteIds(supabase);
        if (active) setFavorites(new Set(ids));
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function toggleFavorite(id) {
    // Deslogado: convida a entrar.
    if (!user) {
      router.push("/entrar");
      return;
    }
    const wasFav = favorites.has(id);
    // Atualização otimista.
    setFavorites((prev) => {
      const next = new Set(prev);
      wasFav ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (wasFav) await removeFavorite(supabase, id);
      else await addFavorite(supabase, id);
    } catch {
      // Reverte em caso de erro.
      setFavorites((prev) => {
        const next = new Set(prev);
        wasFav ? next.add(id) : next.delete(id);
        return next;
      });
    }
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return characters.filter((c) => {
      const matchCat =
        active === "Todos" ||
        (active === FAVORITES ? favorites.has(c.id) : c.category === active);
      if (!q) return matchCat;
      const haystack = normalize(
        `${c.name} ${c.title} ${c.category} ${c.short}`
      );
      return matchCat && haystack.includes(q);
    });
  }, [characters, query, active, favorites]);

  // Mostra o filtro de favoritos só para quem está logado.
  const filters = ["Todos", ...(user ? [FAVORITES] : []), ...categories];

  const emptyMsg =
    active === FAVORITES && !query
      ? "Você ainda não favoritou nenhuma figura. Toque no ♡ de um cartão."
      : `Nenhum personagem encontrado para “${query}”.`;

  return (
    <div className="gallery">
      <div className="gallery-controls">
        <div className="search-box">
          <span className="search-icon" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome (ex.: Francisco, Rita, anjo...)"
            aria-label="Buscar personagem"
          />
        </div>
        <div className="filter-pills">
          {filters.map((f) => (
            <button
              key={f}
              className={`cat-pill ${active === f ? "is-active" : ""}`}
              onClick={() => setActive(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">{emptyMsg}</p>
      ) : (
        <div className="grid">
          {filtered.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              isFavorite={favorites.has(c.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
