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
export const PRECOS = { imagem: 1, avatarVivoPorMinuto: 2 };
