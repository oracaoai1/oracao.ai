// Catálogo de figuras da Igreja Católica, carregado da base de dados curada
// (data/santos.json) construída no Obsidian para o projeto Oração.AI.
// Cada registro traz regras de fidelidade, fontes primárias, Escrituras,
// Catecismo, limites e frases de assinatura — usados para montar o system
// prompt e para enriquecer a interface.

import db from "@/data/santos.json";

const BASE_GUIDANCE = `Você está participando da plataforma Oração.AI, que recria figuras da fé católica para conversas educativas e espirituais.

REGRAS QUE VALEM SEMPRE:
- Permaneça SEMPRE no personagem, em primeira pessoa, com a voz, a época e o temperamento da figura.
- Fale em português do Brasil, de forma calorosa, reverente e acessível. Respostas conversacionais (em geral 2 a 5 parágrafos curtos), nunca como um verbete.
- Toda afirmação histórica ou doutrinal deve ser ancorada e citável. NÃO invente episódios, citações ou "ditos" sem fonte; não crie doutrina, profecia ou revelação nova; nunca apresente fonte apócrifa como autêntica.
- Não prometa milagres, curas ou favores garantidos. Não dê conselho médico, jurídico ou financeiro.
- Em temas delicados (sofrimento, fé em crise, saúde), acolha com caridade e, quando apropriado, sugira buscar um sacerdote, direção espiritual ou ajuda profissional.
- Você é uma recriação respeitosa para fins de estudo e devoção, NÃO a pessoa real e NÃO revelação privada.`;

// Paleta sacra usada para os avatares quando não há imagem.
const PALETTE = [
  "#7c3a2d", "#1f4e5f", "#3f6f3a", "#8a5a9e", "#b8860b",
  "#c75d7c", "#5a4a3a", "#4a5d8a", "#2f6d6a", "#9e5a2f",
];

// Epítetos/títulos curados para exibição nos cartões e no cabeçalho do chat.
const EPITHETS = {
  "sao-francisco": "O Poverello de Assis",
  "santo-agostinho": "Doutor da Graça",
  "sao-gabriel": "O Arcanjo da Anunciação",
  "santa-teresinha": "A Pequena Flor de Lisieux",
  "jesus-cristo": "O Verbo encarnado",
  "ns-aparecida": "Padroeira do Brasil",
  "sao-bento": "Pai do monaquismo ocidental",
  "santa-rita": "A Santa das causas impossíveis",
  "santa-teresa-avila": "Doutora da oração",
  "sao-joao-da-cruz": "Doutor místico",
  "sao-tomas-aquino": "Doutor Angélico",
  "santo-afonso": "Doutor da oração e da moral",
  "sao-jose": "Guardião do Redentor",
  "sao-judas-tadeu": "Apóstolo das causas difíceis",
  "sao-sebastiao": "Mártir e soldado de Cristo",
  "santo-antonio": "Doutor Evangélico",
  "sao-jorge": "O santo guerreiro",
  "sao-cristovao": "Padroeiro dos viajantes",
  "santa-luzia": "Mártir, padroeira dos olhos",
  "frei-galvao": "Primeiro santo nascido no Brasil",
  "santa-dulce": "O Anjo Bom da Bahia",
  "madre-paulina": "Primeira santa do Brasil",
  "ns-fatima": "A Senhora do Rosário",
  "ns-perpetuo-socorro": "Mãe do Perpétuo Socorro",
  "ns-lourdes": "A Imaculada de Lourdes",
  "ns-gracas": "Nossa Senhora da Medalha Milagrosa",
  "joao-paulo-ii": "O Papa Peregrino",
  "santa-faustina": "Apóstola da Divina Misericórdia",
  "madre-teresa": "Santa dos mais pobres",
  "carlo-acutis": "O padroeiro da internet",
  "sao-miguel": "Príncipe das milícias celestes",
  "sao-rafael": "O Arcanjo que cura",
};

// Renomeia o grupo de rollout para um rótulo de categoria amigável.
const CATEGORY_LABEL = {
  "Grupo inicial": "Principais",
};

function hashIndex(id, mod) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % mod;
}

function extract(quemE, label) {
  const re = new RegExp(`${label}[^:]*:\\*\\*\\s*([^\\n]+)`);
  const m = quemE?.match(re);
  if (!m) return "";
  // Remove markdown residual e pontuação final solta.
  return m[1].replace(/\*\*/g, "").replace(/\.$/, "").trim();
}

function cleanLabel(tema) {
  // "**Pobreza evangélica** — desapego..." -> "Pobreza evangélica"
  const bold = tema.match(/\*\*(.+?)\*\*/);
  const text = bold ? bold[1] : tema.split("—")[0];
  return text.replace(/["“”]/g, "").trim();
}

// Ids com retrato disponível em /public/personagens/img-<id>.webp
// (otimizados a partir das imagens curadas no vault do Obsidian).
const WITH_IMAGE = new Set([
  "sao-francisco", "santo-agostinho", "sao-gabriel", "santa-teresinha",
  "jesus-cristo", "ns-aparecida", "sao-bento", "santa-rita",
  "santa-teresa-avila", "sao-joao-da-cruz", "sao-tomas-aquino", "santo-afonso",
  "sao-jose", "sao-judas-tadeu", "sao-sebastiao", "santo-antonio",
  "sao-jorge", "sao-cristovao", "santa-luzia", "frei-galvao",
  "santa-dulce", "ns-fatima", "ns-perpetuo-socorro", "ns-lourdes",
  "ns-gracas", "santa-faustina", "madre-teresa", "carlo-acutis",
  "sao-miguel", "sao-rafael",
]);

function normalize(s, i) {
  const era = extract(s.quem_e, "Datas");
  const feast = extract(s.quem_e, "Festa");
  const themes = (s.temas_voz || []).map(cleanLabel).filter(Boolean);
  const image = WITH_IMAGE.has(s.id) ? `/personagens/img-${s.id}.webp` : null;

  return {
    id: s.id,
    name: s.nome,
    title: EPITHETS[s.id] || "",
    category: CATEGORY_LABEL[s.grupo] || s.grupo,
    era,
    feast,
    image,
    accent: PALETTE[hashIndex(s.id, PALETTE.length)],
    short: themes.slice(0, 3).join(" · "),
    questions: themes.slice(0, 3).map((t) => `Fale-me sobre: ${t}`),
    aviso: s.aviso_ia || "",
    raw: s,
  };
}

export const characters = db.santos.map(normalize);

// Ordena as categorias numa sequência intencional para a navegação.
const CATEGORY_ORDER = [
  "Principais",
  "Doutores/mística",
  "Santos populares no Brasil",
  "Marianos",
  "Anjos",
  "Modernos",
];

export function getCharacter(id) {
  return characters.find((c) => c.id === id) || null;
}

export function getCategories() {
  const present = [...new Set(characters.map((c) => c.category))];
  return present.sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a) + 1 || 99) -
      (CATEGORY_ORDER.indexOf(b) + 1 || 99)
  );
}

function bullets(arr) {
  return (arr || []).map((x) => `- ${x}`).join("\n");
}

export function buildSystemPrompt(character) {
  const s = character.raw;
  const parts = [
    `Você é ${s.nome}. Encarne esta figura com fidelidade histórica e doutrinal.`,
    s.regra_fidelidade ? `REGRA DE FIDELIDADE: ${s.regra_fidelidade}` : "",
    s.quem_e ? `QUEM VOCÊ É:\n${s.quem_e}` : "",
    s.temas_voz?.length ? `TEMAS DA SUA VOZ:\n${bullets(s.temas_voz)}` : "",
    s.fontes_primarias?.length
      ? `FONTES PRIMÁRIAS QUE PODE CITAR:\n${bullets(s.fontes_primarias)}`
      : "",
    s.escrituras?.length
      ? `ESCRITURAS DE REFERÊNCIA:\n${bullets(s.escrituras)}`
      : "",
    s.catecismo ? `CATECISMO E MAGISTÉRIO:\n${s.catecismo}` : "",
    s.frases_assinatura?.length
      ? `FRASES DE ASSINATURA (use com naturalidade):\n${bullets(s.frases_assinatura)}`
      : "",
    s.limites_nao_fazer?.length
      ? `LIMITES — O QUE NUNCA FAZER:\n${bullets(s.limites_nao_fazer)}`
      : "",
    BASE_GUIDANCE,
  ];
  return parts.filter(Boolean).join("\n\n");
}
