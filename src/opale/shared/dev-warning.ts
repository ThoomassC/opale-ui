/* =============================================================================
   LES AVERTISSEMENTS DE DÉVELOPPEMENT, SANS LA TABLE DES DÉPRÉCIATIONS.

   Un composant qui veut seulement prévenir d'un mauvais usage importe ce
   module, quelques dizaines d'octets, et non `deprecations.ts`, qui embarque
   toute sa table. Le test de l'environnement est celui de `deprecations.ts` :
   `process.env.NODE_ENV` traverse le mode librairie intact, et c'est le
   bundler de l'APPLICATION qui le remplace — comme pour React.
   ========================================================================== */

/* `typeof process` ne suffit pas : dans le navigateur, `process` n'existe pas,
   mais le bundler de l'application a déjà réécrit `process.env.NODE_ENV` en
   chaîne littérale. Un garde `typeof process !== 'undefined'` éteindrait donc
   l'avertissement dans tout serveur de développement Vite. On lit l'expression
   telle quelle — c'est elle que les bundlers remplacent. */
declare const process: { readonly env: { readonly NODE_ENV?: string } };

/** Vrai en développement ; une `ReferenceError` (aucun bundler, aucun Node) vaut silence. */
export function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

/* UNE FOIS PAR CHARGEMENT DE PAGE, et par clé : une liste rendue cent fois ne
   doit pas écrire cent lignes. */
const warned = new Set<string>();

/** Avertit une seule fois par clé, et seulement en développement. */
export function warnOnce(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

/** Oublie les avertissements déjà émis. Réservé aux tests. */
export function resetWarnings(): void {
  warned.clear();
}
