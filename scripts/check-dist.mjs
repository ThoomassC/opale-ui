#!/usr/bin/env node
/* =============================================================================
   CE QUE LE BUILD LIVRE, VÉRIFIÉ SUR LE BUILD LUI-MÊME.

   Trois défauts de livraison ne se voient ni aux tests ni au typecheck, parce
   qu'ils n'existent que dans `dist/` :
   - la directive "use client" retirée par le regroupement (Next.js casse) ;
   - des imports relatifs sans extension dans les `.d.ts` (nodenext casse) ;
   - des polices incorporées en base64 dans la feuille bloquante.
   À lancer après `npm run build:lib`.
   ========================================================================== */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

/* Un fichier par module source : chacun porte la directive, puisqu'un
   bundler peut n'en garder qu'un. */
const scripts = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return scripts(path);
    return name.endsWith('.js') ? [path] : [];
  });
const emitted = scripts('dist/opale');
check(emitted.includes(join('dist/opale', 'index.js')), 'dist/opale/index.js est absent.');
for (const file of emitted) {
  check(
    /^\s*["']use client["'];/.test(readFileSync(file, 'utf8')),
    `${file} ne commence pas par "use client";`,
  );
}

const css = readFileSync('dist/opale/opale.css', 'utf8');
check(!css.includes('data:font/'), 'dist/opale/opale.css contient encore des polices en base64.');
check(existsSync('dist/opale/fonts.css'), 'dist/opale/fonts.css est absent.');
/* Une application qui n'importe qu'`opale.css` doit garder ses polices. */
check(
  /^(@charset "[^"]+";\r?\n)?@import '\.\/fonts\.css';/.test(css),
  "dist/opale/opale.css ne relie pas ses polices (@import './fonts.css' en tête).",
);
/* La feuille livrée est minifiée : seuls les commentaires `/*!` (licence) et
   le marqueur de hachage que Vite ajoute en fin de feuille y restent. Un
   commentaire ordinaire signale que la minification a sauté. */
check(
  !/\/\*(?!!|\$vite\$)/.test(css),
  "dist/opale/opale.css contient encore des commentaires : la feuille n'est pas minifiée.",
);
for (const font of ['bricolage-grotesque-latin.woff2', 'chivo-latin.woff2']) {
  check(existsSync(join('dist/opale/fonts', font)), `dist/opale/fonts/${font} est absent.`);
}

const declarations = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return declarations(path);
    return name.endsWith('.d.ts') ? [path] : [];
  });

const BARE_RELATIVE = /\bfrom\s+['"](\.{1,2}\/[^'"]*?)(?<!\.js|\.css|\.scss)['"]/g;
for (const file of [...declarations('dist/opale'), ...declarations('dist/contract')]) {
  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(BARE_RELATIVE)) {
    failures.push(`${file} : import relatif sans extension « ${specifier} ».`);
  }
}

/* LIV-09 — une carte qui renvoie à `src/` renvoie dans le vide : `src/` n'est
   pas livré. Pas de carte de déclarations, et toute carte JS embarque ses
   sources. */
const files = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
for (const file of files('dist')) {
  if (file.endsWith('.d.ts.map')) {
    failures.push(`${file} : carte de déclarations vers des sources non livrées.`);
  } else if (file.endsWith('.js.map')) {
    const map = JSON.parse(readFileSync(file, 'utf8'));
    const embedded = Array.isArray(map.sourcesContent) ? map.sourcesContent.filter(Boolean).length : 0;
    if (embedded !== map.sources.length) {
      failures.push(`${file} : ${map.sources.length - embedded} source(s) non embarquée(s).`);
    }
  }
}

if (failures.length > 0) {
  console.error(`\n✗ dist/ n'est pas livrable :\n  - ${failures.join('\n  - ')}\n`);
  process.exit(1);
}
console.log('✓ dist/ livrable : "use client", déclarations nodenext, polices à part.');
