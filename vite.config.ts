import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Extension-ful on purpose, for the same reason as in `vite.magic.config.ts`:
// Vite's forthcoming native config loader cannot resolve an extensionless
// TypeScript import and warns on every build.

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

  /* =======================================================================
     PLUS AUCUN POST-TRAITEMENT CSS, ET C'EST UNE SUPPRESSION.

     Ce bloc déclarait `tailwindcss` et `autoprefixer` en ligne, avec une longue
     note expliquant pourquoi un `postcss.config.js` à la racine aurait été pire
     — il aurait été ramassé par tout processus Vite du dépôt, `vitest` compris,
     et Tailwind se serait mis à traiter les feuilles sur lesquelles le contrat
     de couleur mesure.

     LA QUESTION NE SE POSE PLUS : Tailwind n'était là que pour les centaines de
     `@apply` des composants copiés d'une librairie tierce. Ces composants sont
     réécrits par Opale, en CSS simple et sur les jetons `--opale-*`, donc les
     trois paquets — `tailwindcss`, `postcss`, `autoprefixer` — sont sortis des
     dépendances.

     CE QU'ON PERD, ET IL FAUT LE SAVOIR : les préfixes constructeur
     qu'`autoprefixer` ajoutait. Les feuilles d'Opale les écrivent donc à la
     main là où ils comptent — `-webkit-backdrop-filter` à côté de
     `backdrop-filter` dans le matériau de verre, qui est le seul endroit où
     Safari l'exige encore.
     ==================================================================== */
  css: {
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
