#!/usr/bin/env node
/* =============================================================================
   LES VARIANTES DE LA FEUILLE LIVRÉE, DÉRIVÉES APRÈS LE BUILD.

   `opale.css` reste la feuille de référence, hors couche et reliée à ses
   polices : rien ne change pour qui l'importe déjà. À côté, trois variantes :

   - `opale.layered.css` — THM-08. Une règle hors couche bat toute règle en
     couche, quelle que soit sa spécificité : les utilitaires de Tailwind v4
     (`@layer utilities`) perdaient donc toujours face à Opale. Rangée dans
     `@layer opale`, la feuille se place où l'application le décide :
     `@layer theme, base, opale, components, utilities;`.
   - `opale-nofonts.css` — THM-16. La même feuille sans `@import './fonts.css'`,
     pour une application qui sert ses propres polices.
   - `opale-nofonts.layered.css` — les deux à la fois.

   L'`@import` et le `@charset` restent DEVANT la couche : un `@import` écrit
   après une règle, ou dans un bloc, est ignoré par le navigateur, et les
   polices seraient perdues sans erreur.

   Lancé par `build:opale`, après `link-fonts.mjs`.
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const LAYER_NAME = 'opale';
export const FONTS_IMPORT = "@import './fonts.css';";
export const SHEET_VARIANTS = [
  'opale.layered.css',
  'opale-nofonts.css',
  'opale-nofonts.layered.css',
];

const PREAMBLE = /^(?:\s*@charset\s+"[^"]*";|\s*@import\s+[^;]+;)*/;

/** Retire la ligne `@import './fonts.css';` et elle seule. */
export function stripFontsImport(css) {
  const index = css.indexOf(FONTS_IMPORT);
  if (index === -1) throw new Error(`la feuille ne contient pas ${FONTS_IMPORT}`);
  const end = index + FONTS_IMPORT.length;
  return css.slice(0, index) + css.slice(css[end] === '\n' ? end + 1 : end);
}

/**
 * Les règles de premier niveau d'une feuille : le nom de la couche pour un
 * `@layer nom { … }`, `null` pour toute autre règle. `@charset` et `@import`
 * ne comptent pas. Chaînes et commentaires sont sautés : une accolade qui s'y
 * trouve n'ouvre ni ne ferme rien.
 */
export function topLevelLayers(css) {
  const found = [];
  let depth = 0;
  let prelude = '';
  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === '/' && css[i + 1] === '*') {
      const close = css.indexOf('*/', i + 2);
      i = close === -1 ? css.length : close + 1;
      continue;
    }
    if (char === '"' || char === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== char) j += css[j] === '\\' ? 2 : 1;
      if (depth === 0) prelude += css.slice(i, j + 1);
      i = j;
      continue;
    }
    if (char === '{') {
      if (depth === 0) {
        const name = /^@layer\s+([\w-]+)$/.exec(prelude.trim());
        found.push(name ? name[1] : null);
        prelude = '';
      }
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth < 0) throw new Error('accolade fermante sans ouvrante');
    } else if (char === ';' && depth === 0) {
      if (!/^@(charset|import)\b/.test(prelude.trim())) found.push(null);
      prelude = '';
    } else if (depth === 0) {
      prelude += char;
    }
  }
  if (depth !== 0) throw new Error('accolade ouvrante jamais fermée');
  return found;
}

/** La même feuille, rangée tout entière dans `@layer opale`. */
export function layerSheet(css) {
  const preamble = PREAMBLE.exec(css)[0];
  const body = css.slice(preamble.length).replace(/^\r?\n/, '');
  if (/@import\b/.test(body)) {
    throw new Error("un @import suit une règle : il tomberait dans la couche, où il est ignoré");
  }
  if (/@layer\b/.test(body)) {
    throw new Error('la feuille déclare déjà une @layer : la ranger dans une autre changerait son ordre');
  }
  const head = preamble ? `${preamble.replace(/^\s+/, '')}\n` : '';
  return `${head}@layer ${LAYER_NAME}{${body.trimEnd()}\n}\n`;
}

/** Écrit les trois variantes à côté de `opale.css`. */
export function writeVariants(directory) {
  const css = readFileSync(join(directory, 'opale.css'), 'utf8');
  const bare = stripFontsImport(css);
  const sheets = {
    'opale.layered.css': layerSheet(css),
    'opale-nofonts.css': bare,
    'opale-nofonts.layered.css': layerSheet(bare),
  };
  for (const [name, content] of Object.entries(sheets)) writeFileSync(join(directory, name), content);
  return Object.keys(sheets);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const written = writeVariants('dist/opale');
  console.log(`dist/opale : ${written.join(', ')} dérivées d'opale.css.`);
}
