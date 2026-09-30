/* =============================================================================
   LE THÈME AVANT LA PREMIÈRE PEINTURE (THM-22).

   MODULE DE PURE DONNÉE : ni React, ni import. Il est livré SANS "use client"
   (voir `scripts/server-safe-modules.mjs`), parce qu'un Server Component —
   le `layout.tsx` de Next.js — doit pouvoir APPELER `opaleThemeScript` et
   obtenir une chaîne, et non une référence client opaque.

   POURQUOI UN SCRIPT EN LIGNE. Le thème choisi vit dans `localStorage`, que le
   serveur ne lit pas : sans lui, la page arrive claire, React monte, puis
   bascule en sombre — un flash à chaque chargement. Un script classique, posé
   dans `<head>` et exécuté avant le `<body>`, pose l'attribut avant que rien
   ne soit peint. Il doit rester synchrone : un module serait différé, donc
   exécuté trop tard.

   Il écrit le thème RÉSOLU — `light` ou `dark`, jamais `system` — parce que
   la feuille d'Opale ne connaît que `:root[data-theme='dark']`.
   ========================================================================== */

/** La préférence de thème : un thème fixe, ou celui du système. */
export type OpaleThemePreference = 'light' | 'dark' | 'system';

/** Le thème réellement appliqué, une fois `system` résolu. */
export type OpaleResolvedTheme = 'light' | 'dark';

/** Les réglages du script anti-flash. Ils doivent être ceux de `useOpaleTheme`. */
export interface OpaleThemeScriptOptions {
  /** La clé `localStorage` du choix mémorisé. Sans clé, seul le défaut s'applique. */
  readonly storageKey?: string;
  /** L'attribut posé sur `<html>`. Défaut : `data-theme`, celui que lit `opale.css`. */
  readonly attribute?: string;
  /** La préférence sans choix mémorisé. Défaut : `system`. */
  readonly defaultTheme?: OpaleThemePreference;
}

/** La requête du thème système. Interne : partagée avec le crochet. */
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/** L'attribut par défaut, lu par les blocs sombres d'`opale.css`. Interne. */
export const DEFAULT_THEME_ATTRIBUTE = 'data-theme';

/** Vrai pour une préférence connue. Interne : partagé avec le crochet. */
export function isOpaleThemePreference(value: unknown): value is OpaleThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/* UNE VALEUR ÉCRITE DANS UN <script> DOIT NE PAS POUVOIR LE FERMER. JSON rend
   une chaîne JavaScript valide ; `<`, `>` et `&` y sont encore littéraux, et
   `</script>` dans une clé fermerait la balise. Échappés en `\uXXXX`, ils
   restent la même chaîne pour JavaScript et ne sont plus rien pour le parseur
   HTML. U+2028 et U+2029, fins de ligne pour certains moteurs anciens, suivent. */
function toScriptLiteral(value: string): string {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

/**
 * Le texte d'un script à poser dans `<head>`, AVANT toute feuille ou tout
 * contenu : il pose le thème résolu sur `<html>` avant la première peinture.
 *
 * Il lit le choix mémorisé sous `storageKey`, retombe sur `defaultTheme`, et
 * résout `system` par `prefers-color-scheme`. Un stockage refusé ou un
 * `matchMedia` absent ne le font pas lever. Les options doivent être celles
 * passées à `useOpaleTheme`, sans quoi le script et React ne s'accordent pas.
 *
 * ATTENTION AUX DÉFAUTS : le script et `useOpaleTheme` suivent le système
 * (`system`), `PageScaffold` part du clair (`light`). Avec `PageScaffold`,
 * passez donc au script la même clé ET le même défaut :
 * `opaleThemeScript({ storageKey: 'site-theme', defaultTheme: 'light' })` pour
 * `<PageScaffold themeStorageKey="site-theme" />`. Sinon, sous un OS sombre et
 * sans choix mémorisé, le script pose le sombre et le gabarit rebascule au clair.
 *
 * Avec Next.js (App Router), dans `app/layout.tsx`, qui reste un Server Component :
 *
 * ```tsx
 * import { opaleThemeScript } from '@thomascaron/opale-ui';
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="fr" suppressHydrationWarning>
 *       <head>
 *         <script
 *           dangerouslySetInnerHTML={{ __html: opaleThemeScript({ storageKey: 'site-theme' }) }}
 *         />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 *
 * `suppressHydrationWarning` sur `<html>` est nécessaire : le script y pose un
 * attribut que le rendu serveur ne connaissait pas. Une politique CSP stricte
 * demande un `nonce` sur la balise, ou l'empreinte du texte dans `script-src`.
 */
export function opaleThemeScript(options: OpaleThemeScriptOptions = {}): string {
  const { storageKey, attribute = DEFAULT_THEME_ATTRIBUTE, defaultTheme = 'system' } = options;
  const fallback = isOpaleThemePreference(defaultTheme) ? defaultTheme : 'system';
  const key = storageKey === undefined ? 'null' : toScriptLiteral(storageKey);
  /* Écrit à la main en ES5 : il s'exécute tel quel, sans passer par le
     compilateur de l'application. */
  return (
    '(function(){try{' +
    `var k=${key},t=${toScriptLiteral(fallback)},v=null;` +
    'try{if(k!==null)v=window.localStorage.getItem(k)}catch(e){}' +
    "if(v!=='light'&&v!=='dark'&&v!=='system')v=t;" +
    "if(v==='system')v=typeof window.matchMedia==='function'&&" +
    `window.matchMedia(${toScriptLiteral(DARK_SCHEME_QUERY)}).matches?'dark':'light';` +
    `document.documentElement.setAttribute(${toScriptLiteral(attribute)},v)` +
    '}catch(e){}})();'
  );
}
