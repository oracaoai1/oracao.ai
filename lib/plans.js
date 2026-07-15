// Fonte única de verdade da economia: tiers, ciclos, Velas e pacotes.
// 1 Vela = R$ 1,00.
export const TIERS = {
  inicial: {
    label: "Inicial",
    mensal: Number(process.env.TIER_INICIAL_MENSAL || 9.9),
    anual: Number(process.env.TIER_INICIAL_ANUAL || 99),
    velasMes: 10,
    liveAvatar: false,
  },
  medio: {
    label: "Médio",
    mensal: Number(process.env.TIER_MEDIO_MENSAL || 29.9),
    anual: Number(process.env.TIER_MEDIO_ANUAL || 299),
    velasMes: 35,
    liveAvatar: true,
  },
  especial: {
    label: "Especial",
    mensal: Number(process.env.TIER_ESPECIAL_MENSAL || 59.9),
    anual: Number(process.env.TIER_ESPECIAL_ANUAL || 599),
    velasMes: 80,
    liveAvatar: true,
  },
};

// Pacotes avulsos de Velas (pagamento único).
export const PACOTES_VELAS = {
  p10: { velas: 10, valor: 10 },
  p30: { velas: 30, valor: 27 },
  p60: { velas: 60, valor: 48 },
  p120: { velas: 120, valor: 84 },
};

// Preço em Velas dos consumos.
export const PRECOS = { imagem: 1, avatarVivoPorMinuto: 2, repetirOracao: 1 };

// Escada de cenas em vídeo: nível -> preço padrão em Velas.
export const NIVEIS_VIDEO = {
  1: { velas: 3, label: "Vislumbre (5-8s)" },
  2: { velas: 8, label: "Cena breve (15s)" },
  3: { velas: 15, label: "Cena completa (30s)" },
  4: { velas: 25, label: "Cena estendida (60s)" },
  5: { velas: 40, label: "Cinematográfica (30s premium)" },
  6: { velas: 90, label: "Épica (90s premium)" },
};
