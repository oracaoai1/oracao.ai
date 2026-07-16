// lib/dailyPrayer.js
// Escolha determinística do "santo do dia" para a Reza Diária: prioriza a
// festa litúrgica do dia (quando algum dos 30 personagens bate com a data);
// sem correspondência, cai num rodízio estável por todos os personagens.
// Ver docs/superpowers/specs/2026-07-15-reza-diaria-streak-design.md

import { characters, getCharacter } from "./characters";

const MESES = {
  janeiro: 1, fevereiro: 2, março: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

// "28 de agosto (e 27/8, ...)" -> "08-28". Pega a PRIMEIRA data mencionada
// no texto livre (a festa principal, quando há uma secundária depois de "e").
function parseFeastToMMDD(feastText) {
  if (!feastText) return null;
  const m = feastText.match(
    /(\d{1,2}|1º)\s*de\s*(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
  );
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = MESES[m[2].toLowerCase()];
  if (!day || !month) return null;
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Mapa "MM-DD" -> ids de personagens com festa nessa data. Construído uma
// vez (módulo é importado uma vez por processo) a partir de characters.
const FEAST_BY_DATE = (() => {
  const map = {};
  for (const c of characters) {
    const mmdd = parseFeastToMMDD(c.feast);
    if (!mmdd) continue;
    (map[mmdd] ||= []).push(c.id);
  }
  return map;
})();

function dayOfYear(year, month, day) {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86400000) + 1;
}

// localDateStr: "YYYY-MM-DD" (data local do navegador do usuário).
export function getDailyCharacter(localDateStr) {
  const [y, m, d] = localDateStr.split("-").map(Number);
  const mmdd = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const doy = dayOfYear(y, m, d);

  const candidatos = FEAST_BY_DATE[mmdd];
  const id =
    candidatos && candidatos.length
      ? candidatos[doy % candidatos.length]
      : characters[doy % characters.length].id;

  return { character: getCharacter(id), dayOfYear: doy };
}

const FRASE_FALLBACK =
  "\"Peço, humildemente, vossas orações por mim.\" — convite simples à oração de hoje.";

// Frase de assinatura do dia (determinística, não muda a cada reload).
export function getDailyFrase(character, doy) {
  const frases = character?.raw?.frases_assinatura;
  if (!frases || !frases.length) return FRASE_FALLBACK;
  return frases[doy % frases.length];
}
