// Sitemap dinâmico: páginas estáticas + uma entrada por personagem e por
// artigo da Biblioteca Católica. Gerado em build/revalidate pelo Next.js.
import { characters } from "@/lib/characters";
import { getAllArtigos } from "@/lib/biblioteca";

const BASE_URL = "https://www.oracao.ai";

export default async function sitemap() {
  const artigos = await getAllArtigos();

  const estaticas = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/biblioteca-catolica`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/assinar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/entrar`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cadastro`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const personagens = characters.map((c) => ({
    url: `${BASE_URL}/chat/${c.id}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const artigosUrls = artigos.map((a) => ({
    url: `${BASE_URL}/biblioteca-catolica/${a.slug}`,
    lastModified: a.publicado_em,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...estaticas, ...personagens, ...artigosUrls];
}
