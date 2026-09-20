import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

// Extension-ful on purpose, for the same reason as in `vite.magic.config.ts`:
// Vite's forthcoming native config loader cannot resolve an extensionless
// TypeScript import and warns on every build.
import tailwindConfig from './tailwind.config.ts';

/**
 * This config builds the SHOWCASE — the documentation site — not the library.
 * The library is emitted by `npm run build:lib`, so the two outputs are kept
 * apart on purpose: `dist/` is what a consumer installs, `dist-showcase/` is a
 * static site nobody depends on.
 *
 * NO `resolve.alias` FOR `@thomascaron/opale-ui`, AND THAT IS A MEASURED CHOICE.
 * The showcase pages import the fourteen published components through the
 * relative specifier `'../../../magic'`, not through the package name a
 * consumer would write. The package is self-referenceable — `package.json` has
 * both a `name` and an `exports` map — so `@thomascaron/opale-ui` DOES resolve
 * from inside the repo; it just resolves to the wrong thing. Measured, not
 * assumed, with `tsc --traceResolution`:
 *
 *     Using 'exports' subpath '.' with target './dist/magic/index.js'
 *     resolved to '.../dist/magic/index.d.ts'
 *
 * That is the BUILD OUTPUT. Aliasing it here would fix the bundler only:
 * `tsc -b --noEmit` and `vitest` read their own configs, and `tsconfig.app.json`
 * has no `paths` while `vitest.config.ts` has no `test.alias`. The result would
 * be three different resolutions of one specifier — the build reading `src/`,
 * the typecheck and the test suite reading a stale `dist/` — which is exactly
 * the kind of silent divergence this repo measures against. The relative
 * specifier resolves to the source in all three tools with zero configuration.
 *
 * TO ADOPT THE BARE SPECIFIER, three files have to change together, and two of
 * them are outside this file's remit: `resolve.alias` here, `compilerOptions.
 * paths` in `tsconfig.app.json`, and `test.alias` in `vitest.config.ts`. The
 * documented USAGE snippets on every component page already say
 * `@thomascaron/opale-ui`, because that IS what a consumer writes — only the
 * showcase's own imports differ, and the difference is deliberate.
 */
export default defineConfig({
  plugins: [react()],

  /* ==========================================================================
     LE PIPELINE POSTCSS, RECOPIÉ DE `vite.magic.config.ts` — ET POURQUOI IL
     EST ÉCRIT EN LIGNE ICI PLUTÔT QU'EN `postcss.config.js` À LA RACINE.

     La vitrine documente désormais les quatorze composants de `src/magic/**`,
     qui se coiffent en `*.module.scss` avec 195 `@apply` de Tailwind. Sans
     Sass + PostCSS + Tailwind, ces feuilles sortent VIDES de déclarations et
     les composants se rendent sans un pixel de style — panne muette, aucune
     erreur de build.

     UN `postcss.config.js` À LA RACINE RÉGLERAIT ÇA ET CASSERAIT AUTRE CHOSE :
     il est ramassé par TOUT processus Vite du dépôt, `vitest` compris. Tailwind
     se mettrait alors à traiter `src/styles/**` et `src/tokens/**`, c'est-à-dire
     précisément les feuilles sur lesquelles le contrat de couleur mesure. La
     déclaration est donc dupliquée en ligne dans les deux configurations qui en
     ont besoin, et nulle part ailleurs.

     CE QUE CE PIPELINE FAIT AUX FEUILLES D'OPALE, mesuré et non supposé : le
     `content` de `tailwind.config.ts` est borné aux sources de `src/magic`,
     donc Tailwind n'émet AUCUN utilitaire depuis `doc.css` ni `tokens.css` —
     vérifié en cherchant les utilitaires dans le CSS de `dist-showcase/`. Les
     trois autres feuilles que cette note citait — `ui.css`, `glass.css` et
     `lens.css` — ne sont plus publiées par la 2.0 ; il ne reste donc que
     `tokens.css`, sur laquelle le contrat de couleur mesure, et `doc.css`, qui
     habille la vitrine. `autoprefixer`, lui, voit bien les deux et y ajoute
     des préfixes constructeur : c'est un ajout de déclarations, jamais un
     remplacement, et les valeurs calculées des surfaces de la vitrine sont
     inchangées (barre du haut, sommaire et plaque de spécimen mesurées
     avant/après, à l'identique).
     ====================================================================== */
  css: {
    postcss: {
      plugins: [tailwindcss(tailwindConfig), autoprefixer()],
    },
    modules: {
      // UN CONTRAT AVEC `src/magic/magic.scss`, et le même que celui de
      // `vite.magic.config.ts` : cette feuille porte trois règles en
      // `:where([class*='opale-magic-'])` — la police Nunito, le reste du
      // Preflight dont leurs composants dépendent, et leurs neuf couleurs de
      // thème. Renommer le préfixe ici ne casse rien de visible au build : les
      // trois règles cessent simplement de s'appliquer à quoi que ce soit.
      generateScopedName: 'opale-magic-[local]-[hash:base64:5]',
    },
  },

  build: { outDir: 'dist-showcase' },
  server: { host: '127.0.0.1' },
});
