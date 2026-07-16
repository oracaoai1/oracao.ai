# Prompts para refinar o logo do Oração.AI (Gemini)

Contexto: logo atual em `public/logo-oracao.png` e `public/oracao-icon.png` —
cruz dourada com asas de anjo, wordmark "Oração.ai" em fonte gótica/blackletter,
sobre fundo navy escuro ou branco. Paleta: dourado (#b8860b a #d8a93a), navy
(#0f1c33 a #1b2a4a).

Aviso: modelos de imagem tendem a errar texto embutido. Prompts 1 e 3 geram só
o símbolo (mais confiável). O Prompt 2 tenta o lockup completo com texto —
trate como exploratório.

---

## Prompt 1 — Símbolo isolado, versão limpa para favicon/ícone de app

```
A minimalist emblem logo: a slender Latin cross at the center, flanked by two
symmetrical angel wings spreading outward, rendered in solid warm gold
(#d8a93a) with subtle darker gold shading (#b8860b) for depth — flat vector
style, NOT photorealistic or glossy/chrome. Clean, bold, simplified feather
shapes (no more than 4-5 feather layers per wing) so the mark stays legible
at very small sizes (like a 32px favicon). Perfectly symmetrical, centered
composition, generous padding around the emblem. Transparent background.
No text, no letters, no watermark, no drop shadow, no 3D bevel effects.
Sacred, dignified, modern devotional branding style.
```

**Objetivo:** símbolo mais simples e vetorial (menos camadas de pena, sem
gradiente 3D), pra funcionar bem como favicon/ícone de app — o atual fica
"borrado" quando encolhido.

---

## Prompt 2 — Lockup completo (símbolo + texto), exploratório

```
A refined logo lockup for a Catholic spirituality brand called "Oração.ai".
Top: a minimalist gold angel-wing cross emblem (flat vector style, symmetrical,
simplified feathers, warm gold gradient from #d8a93a to #b8860b). Below it,
the wordmark "Oração.ai" in an elegant serif typeface with a subtle
blackletter/gothic influence only on the capital O — the rest of the letters
should stay clean and highly legible, not full blackletter. Small tagline
below in a light modern sans-serif: "Plataforma de Fé e Espiritualidade".
Entire lockup on a deep navy background (#0f1c33), well-balanced vertical
spacing between emblem, wordmark and tagline. No extra text, no watermark,
no photorealistic textures.
```

**Objetivo:** versão do logo completo com tipografia mais legível (o atual
usa blackletter pesado demais, difícil de ler em tamanhos médios) e melhor
equilíbrio entre símbolo e texto.

---

## Prompt 3 — Variante em selo/medalhão (mais formal/tradicional)

```
A circular medallion-style emblem logo: a Latin cross with angel wings
integrated tightly within a thin circular border, like a wax seal or
ecclesiastical medal. Solid warm gold (#d8a93a/#b8860b) linework on a deep
navy background (#0f1c33), flat vector illustration style, no photorealistic
metal or glossy shading. The wings curve inward to follow the circle instead
of spreading wide, creating a compact, self-contained badge shape. Symmetrical,
balanced, dignified, minimal detail. No text, no letters, no watermark.
```

**Objetivo:** explorar um formato de selo/medalhão circular — mais compacto e
tradicional que "cruz + asas abertas", pode funcionar melhor como ícone
redondo (ex.: avatar em redes sociais) e tem uma leitura mais "brasão/selo
eclesiástico" do que o estilo atual.

---

## Variações do Prompt 3 (medalhão aprovado — 2026-07-15)

O resultado do Prompt 3 ficou muito bom: contorno grosso, flat vector, anel
duplo, boa legibilidade pequena. As variações abaixo mantêm esse mesmo
acabamento (mesma paleta, mesmo estilo de linha) e só mudam a composição
interna. Dica: no Gemini, você também pode anexar essa imagem aprovada como
referência visual junto com cada prompt, pedindo "generate a variation of
this exact logo style, but...".

### Variação A — Asas se encontrando no topo (arco gótico)

```
A circular medallion emblem logo, flat vector style with thick clean navy
outlines (#0f1c33) and solid gold fill (#d8a93a/#b8860b), matching a
Franciscan/ecclesiastical medal aesthetic. Double ring border. Inside: a
Latin cross with angel wings that curve upward and meet at the top of the
circle, forming a pointed gothic-arch silhouette instead of spreading
sideways. Symmetrical, bold, minimal internal detail, high contrast, no
gradients beyond simple flat shading. No text, no watermark.
```

### Variação B — Cordão franciscano no lugar do anel

```
A circular medallion emblem logo, same flat vector style as reference: thick
navy outlines, solid gold fill, double-ring border. Inside: a Latin cross
with angel wings at the sides (same proportions as reference). Replace the
plain outer ring with a knotted rope/cord border (like a Franciscan habit
cord with three knots), still rendered in flat gold vector style, no
photorealistic rope texture. Symmetrical, bold, high contrast. No text,
no watermark.
```

### Variação C — Pomba no lugar da cruz (Espírito Santo)

```
A circular medallion emblem logo, same flat vector style as reference: thick
navy outlines, solid gold fill, double-ring border, angel wings curving
inward at the sides. Replace the central cross with a simplified dove in
flight, wings slightly open, facing downward as if descending — flat
geometric shape, not photorealistic. Symmetrical composition, bold, minimal
detail, high contrast. No text, no watermark.
```

### Variação D — Monograma "A" (Ave/Ai) entrelaçado

```
A circular medallion emblem logo, same flat vector style as reference: thick
navy outlines, solid gold fill, double-ring border, angel wings curving
inward at the sides framing the center. Replace the plain Latin cross with a
monogram combining a small cross growing out of the top of a stylized letter
"A", flat geometric shapes, no serifs, no photorealistic texture.
Symmetrical, bold, minimal detail. No text besides the monogram, no
watermark.
```
