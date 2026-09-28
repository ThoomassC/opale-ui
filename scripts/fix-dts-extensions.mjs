#!/usr/bin/env node
/* =============================================================================
   LES DÉCLARATIONS PUBLIÉES NOMMENT LEURS FICHIERS EN ENTIER.

   `tsc` recopie les imports relatifs tels que la source les écrit —
   `from './components'` —, ce qui suffit à un bundler mais pas à un projet en
   `moduleResolution: node16/nodenext` : il exige l'extension, refuse le fichier
   (TS2834) et ne trouve plus aucun export (« no exported member Button »).
   Plutôt que de réécrire toutes les sources, les `.d.ts` publiés sont
   complétés après le build : `./x` devient `./x.js`, un dossier `./dir`
   devient `./dir/index.js`.

   Usage : node scripts/fix-dts-extensions.mjs dist/magic dist/contract
   ========================================================================== */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SPECIFIER = /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]*)\2/g;

/**
 * Complète les imports relatifs d'une déclaration.
 * `kindOf(specifier)` dit ce que désigne le chemin : 'file' (un `.d.ts` existe),
 * 'dir' (un `index.d.ts` existe dedans) ou null (on ne touche à rien).
 */
export function addJsExtensions(source, kindOf) {
  return source.replace(SPECIFIER, (match, keyword, quote, specifier) => {
    if (/\.(m?js|cjs|json|css|scss)$/.test(specifier)) return match;
    const kind = kindOf(specifier);
    if (kind === 'file') return `${keyword}${quote}${specifier}.js${quote}`;
    if (kind === 'dir') return `${keyword}${quote}${specifier.replace(/\/$/, '')}/index.js${quote}`;
    return match;
  });
}

function declarations(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return declarations(path);
    return name.endsWith('.d.ts') ? [path] : [];
  });
}

function fixDirectory(directory) {
  let changed = 0;
  for (const file of declarations(directory)) {
    const base = dirname(file);
    const source = readFileSync(file, 'utf8');
    const next = addJsExtensions(source, (specifier) => {
      const target = resolve(base, specifier);
      if (existsSync(`${target}.d.ts`)) return 'file';
      if (existsSync(join(target, 'index.d.ts'))) return 'dir';
      return null;
    });
    if (next !== source) {
      writeFileSync(file, next);
      changed += 1;
    }
  }
  return changed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const directory of process.argv.slice(2)) {
    console.log(`${directory} : ${fixDirectory(directory)} déclaration(s) complétée(s).`);
  }
}
