import { describe, expect, it } from 'vitest';

import entrySource from '../main.tsx?raw';
import barrelSource from './index.ts?raw';
import packageJson from '../../package.json';

/* =============================================================================
   LES FEUILLES DU BARIL DOIVENT ÊTRE RÉIMPORTÉES PAR L'ENTRÉE, ET CE GARDE
   EXISTE PARCE QUE L'OUBLI EST ALLÉ JUSQU'EN PRODUCTION.

   LE MÉCANISME, DÉJÀ DÉMONTÉ DANS `main.tsx`. `package.json` déclare
   `sideEffects` sous forme de TABLEAU. Dès lors, Vite marque
   `moduleSideEffects: false` sur tout module qui ne correspond à aucun motif —
   `src/magic/index.ts` compris, qui est un `.ts` et ne correspondra jamais à un
   motif de feuille de style. Rollup a alors le droit de jeter les instructions
   de premier niveau de ce baril quand seuls ses ré-exports sont consommés, et
   ses `import './…'` de feuilles en font partie. Élargir le motif ne change
   rien : le module élagué n'est pas la feuille, c'est le baril.

   CE QUE CE GARDE AJOUTE À CE COMMENTAIRE. `main.tsx` raconte la panne et la
   corrige POUR UNE FEUILLE. Le baril en importait DEUX — `magic.scss`, traitée,
   et `opale.css`, oubliée — et rien ne rapprochait les deux listes. La seconde
   est donc tombée de la vitrine construite pendant des semaines sans qu'un
   test, un avertissement ou une erreur de console ne le dise : le serveur de
   développement n'élague pas, donc tout était juste à l'écran.

   MESURÉ SUR LE PREMIER DÉPLOIEMENT DE RECETTE : le paquet CSS servi portait
   51 usages de `var(--opale-primary)` et ZÉRO déclaration. La page se peignait
   quand même — `var(--x)` sans valeur invalide une déclaration à la fois, il ne
   casse pas la feuille —, simplement sans aucune couleur de marque, sans rayon,
   et avec les titres tombés sur le sérif par défaut du navigateur.

   CE GARDE COMPARE LES DEUX LISTES. Ajouter une feuille au baril sans
   l'importer depuis l'entrée fait rougir ce fichier, et le message dit quoi
   écrire. C'est le seul endroit où les deux se regardent.

   POURQUOI PAS UNE CORRECTION DANS `package.json`. `main.tsx` l'explique :
   marquer `src/magic/index.ts` porteur d'effets de bord obligerait à en dire
   autant de `dist/magic/index.js`, son équivalent publié, qui est le bundle des
   composants et n'importe AUCUNE feuille — un consommateur qui n'importe qu'un
   composant les embarquerait tous. L'entrée de la vitrine est le bon endroit,
   et ce test est ce qui empêche d'en oublier une.
   ========================================================================== */

/** Les feuilles de style importées par un module, dans l'ordre de lecture. */
function stylesheetImports(source: string): readonly string[] {
  return [...source.matchAll(/^import\s+'(\.[^']*\.(?:css|scss))';$/gm)].map((match) => match[1]);
}

describe('les feuilles du baril `src/magic/index.ts`', () => {
  it('devrait voir son élagage rendu possible par un `sideEffects` en tableau', () => {
    /* LA PRÉMISSE DU GARDE, VÉRIFIÉE PLUTÔT QUE SUPPOSÉE. Si `sideEffects`
       disparaissait ou passait à `true`, le baril cesserait d'être élagable et
       ce fichier garderait une règle sans objet — il faudrait alors le relire,
       pas le laisser passer en silence. */
    expect(
      Array.isArray(packageJson.sideEffects),
      '`sideEffects` n’est plus un tableau : le baril n’est peut-être plus élagué, ' +
        'et la raison d’être de ce garde est à revoir.',
    ).toBe(true);
  });

  it('devrait importer chacune de ses feuilles depuis `src/main.tsx`', () => {
    const fromBarrel = stylesheetImports(barrelSource);
    const fromEntry = stylesheetImports(entrySource).map((path) =>
      path.replace(/^\.\/magic\//, './'),
    );

    /* Le baril DOIT continuer d'importer ses feuilles : c'est ce qui les sert
       au consommateur du paquet publié, où l'entrée de la vitrine n'existe
       pas. Les deux listes se complètent, aucune ne remplace l'autre. */
    expect(fromBarrel.length).toBeGreaterThan(0);

    const missing = fromBarrel.filter((sheet) => !fromEntry.includes(sheet));

    expect(
      missing,
      `Ces feuilles sont importées par \`src/magic/index.ts\` mais PAS par \`src/main.tsx\` : ` +
        `${missing.join(', ')}. Rollup jette les instructions de tête du baril, donc elles ` +
        `tomberont de la vitrine CONSTRUITE sans tomber de la vitrine servie en développement — ` +
        `la panne ne se verra qu'en production. Ajouter \`import './magic/<feuille>';\` dans ` +
        `\`src/main.tsx\`.`,
    ).toEqual([]);
  });
});
