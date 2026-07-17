// lib/liveAvatar.js
// Mapa dos personagens com avatar interativo já criado no HeyGen (painel do
// HeyGen, fora deste código). Só esses têm a opção "Avatar ao Vivo".
const AVATAR_ID_BY_CHARACTER = {
  "sao-francisco": process.env.HEYGEN_AVATAR_SAO_FRANCISCO,
  "ns-aparecida": process.env.HEYGEN_AVATAR_NS_APARECIDA,
  "jesus-cristo": process.env.HEYGEN_AVATAR_JESUS_CRISTO,
  "santa-teresinha": process.env.HEYGEN_AVATAR_SANTA_TERESINHA,
};

export function hasLiveAvatar(characterId) {
  return !!AVATAR_ID_BY_CHARACTER[characterId];
}

export function getAvatarId(characterId) {
  return AVATAR_ID_BY_CHARACTER[characterId] || null;
}

export function getLiveAvatarCharacterIds() {
  return Object.keys(AVATAR_ID_BY_CHARACTER).filter(
    (id) => !!AVATAR_ID_BY_CHARACTER[id]
  );
}
