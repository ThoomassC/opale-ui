#!/usr/bin/env node
/* =============================================================================
   LA FEUILLE LIVRÉE RELIE SES POLICES, SANS LES INCORPORER.

   Les polices ont quitté `opale.css` pour `fonts.css` : le build de la
   librairie les incorporait en base64 dans la feuille bloquante. Mais une
   application qui n'importait qu'`opale.css` les aurait alors perdues, et
   serait retombée sur la police système — une régression visible pour qui
   ne change rien à son code.

   Un `@import` écrit APRÈS le build, en tête de la feuille livrée, garde les
   deux : le bundler du consommateur le suit, résout `fonts.css` à côté et
   charge les woff2 comme des fichiers. Écrit avant le build, Vite l'aurait
   suivi lui-même et tout incorporé de nouveau.
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';

const SHEET = 'dist/opale/opale.css';
const IMPORT = "@import './fonts.css';\n";

const css = readFileSync(SHEET, 'utf8');
/* `@charset` doit rester la toute première instruction de la feuille ; un
   `@import` se place juste après, et avant toute règle. */
const charset = /^@charset "[^"]+";\r?\n/.exec(css)?.[0] ?? '';
const rest = css.slice(charset.length);
if (!rest.startsWith(IMPORT)) writeFileSync(SHEET, charset + IMPORT + rest);
console.log(`${SHEET} : polices reliées par @import.`);
