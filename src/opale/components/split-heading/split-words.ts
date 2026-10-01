/* =============================================================================
   LE DÉCOUPAGE EN MOTS, EN CALCUL PUR.

   Les mots sont coupés sur les espaces sécables seulement : une espace
   insécable (U+00A0, U+202F) lie déjà deux signes, elle reste dans le mot.
   Un texte sans espace — le chinois, le japonais — reste un seul mot.

   LA PONCTUATION ISOLÉE RESTE AVEC SON MOT. Le texte brut ne coupe jamais la
   ligne avant « ! » ni après « ( » (UAX 14) ; deux `inline-block` voisins, si.
   Un signe sans lettre ni chiffre rejoint donc le mot qui le précède, et un
   signe ouvrant (« ( », « « ») le mot qui le suit.
   ========================================================================== */

const SPACE = /[ \t\n\r\f]+/;
const LETTER = /[\p{L}\p{N}]/u;
const OPENING = /^[\p{Ps}\p{Pi}]+$/u;

/** Les mots d'un texte, dans l'ordre, la ponctuation isolée collée à son mot. */
export function splitWords(text: string): string[] {
  const words: string[] = [];
  let glue = false;
  for (const token of text.split(SPACE)) {
    if (!token) continue;
    const last = words.length - 1;
    if (last >= 0 && (glue || (!LETTER.test(token) && !OPENING.test(token))))
      words[last] += ` ${token}`;
    else words.push(token);
    glue = OPENING.test(token);
  }
  return words;
}
