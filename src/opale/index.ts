/* L'ENTRÉE RACINE DU PAQUET.

   Elle servait le code d'une librairie tierce ; elle ne sert plus que celui
   d'Opale. Les deux feuilles sont importées ICI et non seulement déclarées :
   `motion.scss` porte le filet anti-mouvement global, `opale.css` les jetons et
   les composants. Voir `barrel-side-effects.structure.test.ts`, qui tient
   cette paire contre `src/main.tsx`. */
import './motion.scss';
import './opale.css';
export * from './components';
export * from './opale';
export type * from './shared';
/* LE THÈME DU DOCUMENT (THM-22), importé module par module et non par un
   baril : `theme-script` est un module de DONNÉES, livré sans "use client",
   pour qu'un `layout.tsx` serveur obtienne la chaîne du script et non une
   référence client. Un baril `theme/index` recevrait la directive, et la
   ferait porter à ce qu'il réexporte. */
export { opaleThemeScript } from './theme/theme-script';
export type {
  OpaleResolvedTheme,
  OpaleThemePreference,
  OpaleThemeScriptOptions,
} from './theme/theme-script';
export { useOpaleTheme } from './theme/use-opale-theme';
export type { UseOpaleThemeOptions, UseOpaleThemeResult } from './theme/use-opale-theme';
