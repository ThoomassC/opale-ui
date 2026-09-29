import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

import { isServerSafeModule } from './scripts/server-safe-modules.mjs';

// Extension-ful on purpose: Vite's forthcoming native config loader cannot
// resolve an extensionless TypeScript import and warns on every build.

const LIB_OUT_DIR = 'dist/opale';
const TYPES_ENTRY = `${LIB_OUT_DIR}/index.d.ts`;
/* LA NOTICE DE LICENCE VOYAGE AVEC LE FICHIER. Seul un commentaire `/*!`
   survit au regroupement : il porte la licence MIT d'Opale, pour le cas où le
   module serait copié seul, hors du paquet. */
const LICENSE_BANNER =
  '/*! @thomascaron/opale-ui — MIT License, Copyright (c) 2026 Thomas Caron. */';
const STYLE_SIDE_EFFECT_IMPORT = /^\s*import\s+['"]\.\/[\w.-]+\.s?css['"];?[ \t]*\r?\n/gm;

/**
 * Strips the `import './motion.scss';` line out of the emitted types entry.
 *
 * `src/opale/index.ts` opens with that side-effect import, and `tsc` faithfully
 * carries it into `dist/opale/index.d.ts`. But `dist/` never contains a
 * `motion.scss`: Sass compiles it, Vite emits it as `dist/opale/opale.css`, and
 * the JavaScript bundle drops the import entirely. The declaration is therefore
 * pointing at a file that does not ship, and a consumer's own `tsc` refuses it:
 *
 *   dist/opale/index.d.ts(1,8): error TS2882: Cannot find module or type
 *   declarations for side-effect import of './motion.scss'.
 *
 * Measured against a probe consumer on `moduleResolution: "bundler"` before
 * this plugin existed. Removing the line makes the declaration agree with the
 * JavaScript that ships next to it — neither one imports a stylesheet, which is
 * exactly why `exports["./opale.css"]` exists and must be imported by hand.
 *
 * The hook throws rather than skipping when the file is missing, so a
 * reordering of `build:opale` that leaves the types entry unwritten fails the
 * build instead of silently publishing broken types.
 */
const stripStyleImportFromTypes = (): Plugin => ({
  name: 'opale-strip-style-import-from-types',
  apply: 'build',
  closeBundle() {
    const file = resolve(import.meta.dirname, TYPES_ENTRY);
    const before = readFileSync(file, 'utf8');
    const after = before.replace(STYLE_SIDE_EFFECT_IMPORT, '');
    if (after !== before) writeFileSync(file, after);
  },
});

/**
 * The `@thomascaron/opale-ui` ROOT entry point.
 *
 * This is a THIRD build, kept apart from the other two on purpose:
 *
 *   - `npm run build:lib`  → the whole chain below, in order
 *   - `npm run build`      → `vite.config.ts`         (`dist-showcase/`, a site)
 *   - `npm run build:opale`→ this file                (`dist/opale/**`)
 *
 * WHAT `tsc` STILL OWNS, IN 2.0: the colour contract, and only it.
 * `tsc -p tsconfig.lib.json` emits `dist/contract/**` — pure TypeScript with no
 * stylesheet of its own, so there is nothing to bundle. The COMPONENTS cannot
 * work that way: they import `*.module.scss`, which needs Sass, PostCSS,
 * Tailwind's `@apply`, and a class name mangler. That is a bundler's job, which
 * is why the root entry point of the package is emitted here and not by `tsc` —
 * a `tsc`-built re-export of these components would not resolve a
 * `*.module.scss` at all.
 *
 * Type declarations are NOT produced here. `tsc -p tsconfig.opale.json` emits
 * them BEFORE this build (see the `build:opale` script) rather than pulling in
 * `vite-plugin-dts`, which would drag api-extractor along and pin itself
 * against a TypeScript version this repo is ahead of. `tsc` runs first so that
 * the plugin above can correct its output on the way out.
 */
export default defineConfig({
  plugins: [react(), stripStyleImportFromTypes()],

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
      // A CONTRACT with `src/opale/motion.scss`. That sheet scopes the font
      // family with `:where([class*='opale-mod-'])`, a selector that matches
      // nothing unless every CSS-module class carries this prefix. Rename the
      // prefix here and the rule silently stops applying — it will not error.
      generateScopedName: 'opale-mod-[local]-[hash:base64:5]',
    },
  },

  // `public/` belongs to the showcase. Left at its default, Vite copies it
  // into `outDir` and `dist/opale/` ships the showcase's `favicon.svg` and
  // `icons.svg` to every consumer of the package. Measured, not assumed: the
  // first run of this build emitted both.
  publicDir: false,

  build: {
    outDir: LIB_OUT_DIR,
    // NOT emptied here, and that is deliberate: `tsc -p tsconfig.opale.json`
    // has already written the `.d.ts` tree into this directory by the time
    // Vite runs. The `rm -rf dist/opale` at the head of the `build:opale`
    // script is what guarantees a clean directory.
    //
    // It used to do a second job that it no longer has to: discarding the
    // unusable flat emit that `tsc -p tsconfig.lib.json` dropped here, because
    // that project had `src` in its `include`. `tsconfig.lib.json` now includes
    // `src/contract` and nothing else, so the collision is gone at the source.
    emptyOutDir: false,
    // One sheet, not one per component. It is published as a single
    // `@thomascaron/opale-ui/opale.css` import — the only component stylesheet
    // the package has in 2.0, next to `./tokens.css`.
    cssCodeSplit: false,
    sourcemap: true,
    // Left unminified, like the `tsc` output in `dist/`. A library ships
    // readable code and lets the consumer's bundler minify; it also keeps the
    // "no React inlined here" check on `dist/opale/index.js` verifiable by
    // eye rather than by bundle-size guesswork.
    minify: false,
    // LA FEUILLE, ELLE, EST MINIFIÉE : ses commentaires de conception pesaient
    // près de la moitié du fichier livré, et un consommateur n'a aucune raison
    // de les télécharger. `cssMinify` est indépendant de `minify`, donc le
    // JavaScript reste lisible. `scripts/link-fonts.mjs` pose ensuite
    // `@import './fonts.css'` juste après le `@charset`.
    cssMinify: 'esbuild',
    lib: {
      entry: 'src/opale/index.ts',
      formats: ['es'],
      // Un nom par module conservé : l'entrée reste `index.js`.
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Une constante importée reste importée : inlinée, elle laissait un
      // `import '../modal/Modal.js'` nu que les bundlers consommateurs
      // signalent, le paquet déclarant son JavaScript sans effet de bord.
      optimization: { inlineConst: false },
      // Everything these components reach for outside themselves. `clsx` is
      // externalised rather than bundled because it is declared as a real
      // runtime dependency of the package: bundling it would ship a second
      // copy to any consumer that already has it.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client',
        'clsx',
        // Belt and braces for any React subpath the JSX transform or a future
        // component reaches for (`react/jsx-dev-runtime`, `react-dom/server`).
        /^react\//,
        /^react-dom\//,
      ],
      output: {
        // Names the single emitted stylesheet `opale.css`. Without this, Vite
        // library mode calls it `style.css`.
        assetFileNames: 'opale.[ext]',

        // UN FICHIER PAR MODULE SOURCE, et c'est ce qui rend le paquet
        // élagable. Avec `"sideEffects": ["**/*.css"]`, le bundler d'une
        // application écarte chaque module qu'elle n'importe pas : un
        // `Divider` seul ne tire plus le reste du catalogue.
        // `scripts/check-size.mjs` tient ce poids sous un budget.
        preserveModules: true,
        preserveModulesRoot: 'src/opale',

        /* `"use client";` D'ABORD, SUR CHAQUE MODULE CLIENT. Les composants
           appellent useState, createContext et createPortal : sans la
           directive, un Server Component de Next.js qui importe un Button
           échoue. La bannière la pose en tête du fichier émis, là où React
           l'exige — avant tout commentaire qui ne serait pas une directive.

           SAUF SUR LES MODULES DE `scripts/server-safe-modules.mjs`. Sur une
           donnée, la directive ment : côté serveur, `ICON_NAMES` devenait une
           référence client de longueur 0, `COOKIE_CONSENT_KEY` une fonction
           qui lève. Les barils en sont aussi épargnés — c'est ce qui laisse
           passer ces valeurs jusqu'au serveur, tandis que chaque composant
           qu'ils réexportent garde sa propre directive.
           `scripts/check-dist.mjs` vérifie les deux cas, fichier par fichier. */
        banner: (chunk) =>
          `${isServerSafeModule(chunk.fileName) ? '' : '"use client";\n'}${LICENSE_BANNER}`,
      },
    },
  },
});
