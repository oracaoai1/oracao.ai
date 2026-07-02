// Mapa de vozes (ElevenLabs) por personagem. Vozes escolhidas entre as
// disponíveis na conta; homens usam vozes nativas em PT-BR/PT, mulheres usam
// as melhores vozes femininas disponíveis (sotaque inglês + modelo multilíngue,
// que pronuncia o português). Para vozes femininas nativas em PT-BR, basta
// adicioná-las à biblioteca do ElevenLabs e trocar os ids abaixo.
export const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah — reconfortante

// Ids de voz reutilizáveis (perfis).
const V = {
  pt_deep: "GIuLCSVfgJaUuh7hYOY8",       // Lucas — narrador profundo (BR)
  pt_francisco: "x6uRgOliu4lpcrqMH3s1",  // Flávio — profunda e cativante (BR)
  pt_calm: "pgoedMoL7SCrpaX44PjD",       // Marcus Coelho — calmo (PT)
  pt_young: "ZxhW0J5Q17DnNxZM6VDC",      // Gabriel Neutro (BR jovem)
  pt_severe: "AxmQsSdsz8MlV0gY8pKp",     // Rafael — severo (BR jovem)
  pt_elder: "A26KfvFuSKaMzhhYkSlQ",      // Adilson — masculino idoso (PT)
  pt_elder2: "Hsrdp9vv51A8JfLqfIH8",     // Jaan — masculino idoso (BR)
  f_mature: "EXAVITQu4vr4xnSDxMaL",      // Sarah — madura, maternal
  f_velvet: "pFZP5JQG7iQjIQuC4Bku",      // Lily — aveludada
  f_young: "cgSgspJ2msm6clMCkdW9",       // Jessica — jovem, luminosa
  f_clear: "Xb7hH8MSUJpSbSDYk0k2",       // Alice — clara
  f_wise: "XrExE9yKIg1WjnnlVkGX",        // Matilda — sábia
};

// Personagem -> voz. Não listados usam DEFAULT_VOICE_ID.
const VOICE_BY_ID = {
  // Cristo e anjos
  "jesus-cristo": V.pt_deep,
  "sao-miguel": V.pt_deep,
  "sao-gabriel": V.pt_young,
  "sao-rafael": V.pt_severe,
  // Doutores / místicos / fundadores
  "santo-agostinho": V.pt_elder,
  "sao-tomas-aquino": V.pt_elder,
  "sao-bento": V.pt_elder,
  "sao-joao-da-cruz": V.pt_calm,
  "santo-afonso": V.pt_calm,
  // Populares (masculinos)
  "sao-francisco": V.pt_francisco,
  "sao-jose": V.pt_calm,
  "santo-antonio": V.pt_young,
  "sao-judas-tadeu": V.pt_francisco,
  "sao-sebastiao": V.pt_severe,
  "sao-jorge": V.pt_severe,
  "sao-cristovao": V.pt_elder2,
  "frei-galvao": V.pt_calm,
  "carlo-acutis": V.pt_young,
  "joao-paulo-ii": V.pt_elder2,
  // Femininas
  "santa-teresinha": V.f_young,
  "santa-rita": V.f_mature,
  "santa-teresa-avila": V.f_velvet,
  "santa-luzia": V.f_clear,
  "santa-dulce": V.f_mature,
  "madre-paulina": V.f_wise,
  "santa-faustina": V.f_velvet,
  "madre-teresa": V.f_wise,
  // Marianas (maternal)
  "ns-aparecida": V.f_mature,
  "ns-fatima": V.f_mature,
  "ns-perpetuo-socorro": V.f_mature,
  "ns-lourdes": V.f_velvet,
  "ns-gracas": V.f_mature,
};

export function getVoiceId(characterId) {
  return VOICE_BY_ID[characterId] || DEFAULT_VOICE_ID;
}
