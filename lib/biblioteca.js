// lib/biblioteca.js
// Camada de dados da Biblioteca Espiritual.
// Para migrar ao Supabase, substituir as funções por queries Supabase.

import { artigos } from '@/data/biblioteca-artigos';

export async function getAllArtigos() {
  return [...artigos].sort(
    (a, b) => new Date(b.publicado_em) - new Date(a.publicado_em)
  );
}

export async function getArtigoPorSlug(slug) {
  return artigos.find((a) => a.slug === slug) ?? null;
}

export async function getAllSlugs() {
  return artigos.map((a) => ({ slug: a.slug }));
}

export async function getCategorias() {
  return [...new Set(artigos.map((a) => a.categoria))];
}

export function formatarData(dataStr) {
  const meses = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro',
  ];
  const d = new Date(dataStr + 'T12:00:00');
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}
