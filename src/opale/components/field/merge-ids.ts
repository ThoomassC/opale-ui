import type { ReactNode } from 'react';

/* =============================================================================
   LES IDENTIFIANTS D'UNE DESCRIPTION SE FUSIONNENT, ILS NE SE REMPLACENT PAS.

   La même règle que `mergeIds` dans `catalog/forms.tsx`, reprise ici pour les
   trois champs de la 2.10 — `Field`, `Textarea`, `RadioGroup` — qui vivent
   hors du catalogue. Les identifiants de l'appelant passent d'abord, puis
   l'aide, puis l'erreur ; les doublons tombent. Interne : non réexporté.
   ========================================================================== */

/** Joint des listes d'identifiants en une seule, sans doublon, ou `undefined`. */
export function mergeIds(
  ...ids: ReadonlyArray<string | false | null | undefined>
): string | undefined {
  const unique = new Set(ids.flatMap((id) => (id ? id.split(/\s+/).filter(Boolean) : [])));
  return unique.size > 0 ? [...unique].join(' ') : undefined;
}

/** Un `ReactNode` qui rend quelque chose : ni absent, ni `false`, ni chaîne vide. */
export function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}
