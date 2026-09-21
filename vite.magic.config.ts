import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Extension-ful on purpose: Vite's forthcoming native config loader cannot
// resolve an extensionless TypeScript import and warns on every build.

const MAGIC_OUT_DIR = 'dist/magic';
const TYPES_ENTRY = `${MAGIC_OUT_DIR}/index.d.ts`;
const STYLE_SIDE_EFFECT_IMPORT = /^\s*import\s+['"]\.\/[\w.-]+\.s?css['"];?[ \t]*\r?\n/gm;

/**
 * Strips the `import './magic.scss';` line out of the emitted types entry.
 *
 * `src/magic/index.ts` opens with that side-effect import, and `tsc` faithfully
 * carries it into `dist/magic/index.d.ts`. But `dist/` never contains a
 * `magic.scss`: Sass compiles it, Vite emits it as `dist/magic/magic.css`, and
 * the JavaScript bundle drops the import entirely. The declaration is therefore
 * pointing at a file that does not ship, and a consumer's own `tsc` refuses it:
 *
 *   dist/magic/index.d.ts(1,8): error TS2882: Cannot find module or type
 *   declarations for side-effect import of './magic.scss'.
 *
 * Measured against a probe consumer on `moduleResolution: "bundler"` before
 * this plugin existed. Removing the line makes the declaration agree with the
 * JavaScript that ships next to it — neither one imports a stylesheet, which is
 * exactly why `exports["./opale.css"]` exists and must be imported by hand.
 *
 * The hook throws rather than skipping when the file is missing, so a
 * reordering of `build:magic` that leaves the types entry unwritten fails the
 * build instead of silently publishing broken types.
 */
const stripStyleImportFromTypes = (): Plugin => ({
  name: 'opale-magic-strip-style-import-from-types',
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
 *   - `npm run build:magic`→ this file                (`dist/magic/**`)
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
 * Type declarations are NOT produced here. `tsc -p tsconfig.magic.json` emits
 * them BEFORE this build (see the `build:magic` script) rather than pulling in
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
      // A CONTRACT with `src/magic/magic.scss`. That sheet scopes the font
      // family with `:where([class*='opale-magic-'])`, a selector that matches
      // nothing unless every CSS-module class carries this prefix. Rename the
      // prefix here and the rule silently stops applying — it will not error.
      generateScopedName: 'opale-magic-[local]-[hash:base64:5]',
    },
  },

  // `public/` belongs to the showcase. Left at its default, Vite copies it
  // into `outDir` and `dist/magic/` ships the showcase's `favicon.svg` and
  // `icons.svg` to every consumer of the package. Measured, not assumed: the
  // first run of this build emitted both.
  publicDir: false,

  build: {
    outDir: MAGIC_OUT_DIR,
    // NOT emptied here, and that is deliberate: `tsc -p tsconfig.magic.json`
    // has already written the `.d.ts` tree into this directory by the time
    // Vite runs. The `rm -rf dist/magic` at the head of the `build:magic`
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
    // "no React inlined here" check on `dist/magic/index.js` verifiable by
    // eye rather than by bundle-size guesswork.
    minify: false,
    lib: {
      entry: 'src/magic/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
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
        // Names the single emitted stylesheet `magic.css`. Without this, Vite
        // library mode calls it `style.css`.
        assetFileNames: 'magic.[ext]',

        // THE MIT NOTICE, PUT BACK ON THE EMITTED JAVASCRIPT.
        //
        // All 53 vendored sources carry a provenance banner, and the bundle
        // carried NONE of them: measured, `grep -c tweeedlex dist/magic/index.js`
        // returned 0 while `magic.css` kept 29. Rollup drops a plain block
        // comment; only `/*!` (or an `@license`/`@preserve` annotation) survives
        // minification and tree-shaking, and the vendored banners use neither.
        //
        // This is not housekeeping. The MIT licence requires its copyright
        // notice to be included "in all copies or substantial portions of the
        // Software", and `dist/magic/index.js` is the substantial portion — it
        // is the whole library. `THIRD-PARTY-NOTICES.md` now ships in the
        // tarball too, but a notice that travels WITH the file also covers the
        // case where only the bundle is copied out.
        banner:
          '/*! Opale components, vendored from react-magic-ui (https://github.com/tweeedlex/react-magic-ui) — MIT License, Copyright (c) 2025 tweeedlex. Full text in THIRD-PARTY-NOTICES.md. */',
      },
    },
  },
});
