/* L'ENTRÉE RACINE DU PAQUET.

   Elle servait le code d'une librairie tierce ; elle ne sert plus que celui
   d'Opale. Les deux feuilles sont importées ICI et non seulement déclarées :
   `magic.scss` porte le filet anti-mouvement global, `opale.css` les jetons et
   les composants. Voir `barrel-side-effects.structure.test.ts`, qui tient
   cette paire contre `src/main.tsx`. */
import './magic.scss';
import './opale.css';
export * from './components';
export * from './opale';
