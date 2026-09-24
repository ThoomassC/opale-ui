import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Les jetons d'abord. Ils ne coiffent plus aucun composant de la librairie — la
// 2.0 ne publie que les quatorze composants verre liquide de `src/magic/**`, qui
// n'emploient AUCUN jeton `--tc-*` — mais la vitrine, elle, reste habillée par
// eux : `doc.css` ne cite que des `var(--tc-*)` et n'en déclare aucun.
import './tokens/tokens.css';

/* =============================================================================
   LA FEUILLE DES COMPOSANTS, ET ELLE EST ICI PARCE QU'ICI EST L'ENTRÉE.

   `src/magic/index.ts` ouvre déjà par `import './magic.scss';`. CELA NE SUFFIT
   PAS, et l'import ci-dessous n'est donc pas une redondance : mesuré sur la
   vitrine construite, la feuille était ABSENTE du bundle. Aucune erreur, aucun
   avertissement — les composants se peignaient, puisque chaque `*.module.scss`
   arrive par l'import de son composant, mais les six écarts de `magic.scss`
   manquaient tous : pas de Nunito, pas le reste du Preflight (donc des boutons
   au chrome natif du moteur), aucune des neuf couleurs de thème, aucune prise
   en charge de `prefers-reduced-motion`, et — la couche `@tailwind utilities`
   vivant dans ce même fichier — ni `rounded-full` ni `pointer-events-none`,
   donc la pilule de `Badge` ne s'appliquait pas non plus.

   LA CAUSE, MESURÉE, ET CE N'EST PAS CELLE QU'ON CROYAIT. Le premier diagnostic
   disait : « `sideEffects` vaut `["*.css"]`, `*` ne franchit pas une barre
   oblique, donc `src/magic/magic.scss` n'est couvert par rien. » L'observation
   était juste, le mécanisme faux. Élargir le motif au récursif ne change rien —
   c'est le contre-exemple qui tranche :

   (les motifs récursifs sont écrits `**\/` : un `**` suivi d'une barre oblique
   fermerait ce commentaire.)

     "sideEffects": ["*.css"]                             -> ABSENTE
     "sideEffects": ["*.css", "*.scss"]                   -> ABSENTE
     "sideEffects": ["**\/*.css", "**\/*.scss"]           -> ABSENTE ← récursif !
     "sideEffects": ["**\/*.scss"]                        -> ABSENTE
     "sideEffects": ["**\/*.css", "src/magic/index.ts"]   -> PRÉSENTE ← sans .scss
     "sideEffects": ["src/magic/index.ts"]                -> PRÉSENTE
     "sideEffects" retiré, ou `true`                      -> PRÉSENTE

   Le module élagué n'est pas la feuille, c'est LE BARIL. Dès que `sideEffects`
   est un tableau, Vite marque `moduleSideEffects: false` sur tout module qui ne
   correspond à aucun motif — `src/magic/index.ts` compris, qui est un `.ts` et
   ne correspondra jamais à un motif de feuille de style. Rollup a alors le
   droit de jeter les instructions de premier niveau de ce module quand seuls
   ses ré-exports sont consommés, et l'instruction `import './magic.scss';` en
   fait partie. La feuille n'est même jamais résolue : lister le `.scss` ne peut
   donc rien y faire, et lister le baril suffit sans lister le `.scss`.

   POURQUOI LA CORRECTION EST ICI ET NON DANS `package.json`. Marquer
   `src/magic/index.ts` porteur d'effets de bord obligerait à en dire autant de
   `dist/magic/index.js`, son équivalent publié — or ce fichier est le bundle
   des quatorze composants et n'importe AUCUNE feuille (vérifié : zéro
   occurrence de `.css` dans `dist/magic/index.js`). Le déclarer porteur
   d'effets de bord ferait embarquer les quatorze composants à un consommateur
   qui n'en importe qu'un. `main.tsx` est le module d'ENTRÉE de la vitrine, et
   les instructions d'une entrée sont toujours conservées : la vitrine est
   servie, et le contrat d'élagage du paquet publié reste juste.
   ========================================================================== */
import './magic/magic.scss';

/* =============================================================================
   `opale.css` EST IMPORTÉ ICI POUR LA MÊME RAISON QUE `magic.scss`, ET SON
   ABSENCE S'EST VUE EN PRODUCTION AVANT DE SE VOIR ICI.

   Le commentaire ci-dessus démonte l'élagage qui fait disparaître les
   instructions de tête de `src/magic/index.ts`. Ce baril en porte DEUX :
   `import './magic.scss';` — traité — et `import './opale.css';` — oublié. La
   seconde feuille a donc continué de tomber, et rien ne le disait : le serveur
   de développement n'élague pas, donc la vitrine était juste à l'écran pendant
   que la vitrine CONSTRUITE ne l'était pas.

   MESURÉ SUR LE PREMIER DÉPLOIEMENT DE RECETTE : le paquet CSS servi portait
   51 usages de `var(--opale-primary)` et ZÉRO déclaration. Aucun jeton
   `--opale-*` n'existait, donc aucune couleur de marque, aucun rayon, aucune
   police — les titres tombaient sur le sérif par défaut du navigateur, et la
   règle `@import` de Google Fonts qui ouvrait alors `opale.css` n'était jamais servie
   non plus, donc ni Chivo ni Bricolage Grotesque n'étaient téléchargés.

   Le repli le rendait DISCRET plutôt que visible : `var(--x)` sans valeur ne
   casse pas la feuille, il invalide une déclaration à la fois. La page se
   peignait, mal, sans une erreur de console.
   ========================================================================== */
import './magic/opale.css';

// Hack est embarquée avec la vitrine : les exemples restent identiques sur
// toutes les machines, sans dépendre d'une police installée localement.
import 'hack-font/build/web/hack.css';

// L'habillage de la vitrine, et lui seul : `doc.css` n'est pas publié dans le
// paquet, donc aucun consommateur ne le télécharge. Il vient en dernier.
import './styles/doc.css';
import './styles/doc-v3.css';

import { CharterPage } from './showcase/charter-page';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root introuvable : index.html a-t-il changé ?');
}

createRoot(container).render(
  <StrictMode>
    <CharterPage />
  </StrictMode>,
);
