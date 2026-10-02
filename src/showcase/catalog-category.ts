/* Deux familles du catalogue publié gardent leur nom anglais : `OPALE_CATALOG`
   est encore exporté, ses valeurs ne bougent pas en 2.x. La vitrine les
   affiche en français. */
const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  Inputs: 'Saisie',
  Feedback: 'Retours',
};

/** Le libellé français d'une famille du catalogue. */
export function catalogCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
