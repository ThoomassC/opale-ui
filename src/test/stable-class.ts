/* =============================================================================
   VISER UNE PARTIE PAR SA CLASSE STABLE, PAS PAR UN `data-testid`.

   Opale ne pose plus aucun attribut de test (4.0.0) : quand un rôle ARIA ne
   désigne pas la partie voulue — le voile d'une modale, la carte d'un toast —,
   un test vise sa classe stable `opale-*`, la même qu'une feuille d'hôte.
   Mêmes garanties que `getByTestId` / `getAllByTestId` : une partie absente,
   ou présente deux fois là où on en attend une, fait échouer le test.
   ========================================================================== */

/** L'unique élément qui porte la classe ; lève s'il n'y en a aucun ou plusieurs. */
export function byClass(className: string): HTMLElement {
  const found = allByClass(className);
  if (found.length > 1) {
    throw new Error(`Plusieurs éléments portent la classe « ${className} » (${found.length}).`);
  }
  return found[0];
}

/** Tous les éléments qui portent la classe ; lève s'il n'y en a aucun. */
export function allByClass(className: string): HTMLElement[] {
  const found = queryAllByClass(className);
  if (found.length === 0) throw new Error(`Aucun élément ne porte la classe « ${className} ».`);
  return found;
}

/** L'élément qui porte la classe, ou `null`. */
export function queryByClass(className: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.${className}`);
}

function queryAllByClass(className: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`.${className}`));
}
