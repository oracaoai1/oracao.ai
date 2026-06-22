"use client";

import { useMemo, useState } from "react";
import CharacterCard from "./CharacterCard";

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function CharacterGallery({ characters, categories }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("Todos");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return characters.filter((c) => {
      const matchCat = active === "Todos" || c.category === active;
      if (!q) return matchCat;
      const haystack = normalize(
        `${c.name} ${c.title} ${c.category} ${c.short}`
      );
      return matchCat && haystack.includes(q);
    });
  }, [characters, query, active]);

  const filters = ["Todos", ...categories];

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
        <p className="empty-state">
          Nenhum personagem encontrado para “{query}”.
        </p>
      ) : (
        <div className="grid">
          {filtered.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </div>
  );
}
