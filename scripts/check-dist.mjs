#!/usr/bin/env node
/* =============================================================================
   CE QUE LE BUILD LIVRE, VÉRIFIÉ SUR LE BUILD LUI-MÊME.

   Trois défauts de livraison ne se voient ni aux tests ni au typecheck, parce
   qu'ils n'existent que dans `dist/` :
   - la directive "use client" retirée par le regroupement (Next.js casse), ou
     posée sur un module de données (ses valeurs mentent côté serveur) ;
   - des imports relatifs sans extension dans les `.d.ts` (nodenext casse) ;
   - des polices incorporées en base64 dans la feuille bloquante.
   À lancer après `npm run build:lib`.
   ========================================================================== */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

import {
  LAYER_NAME,
  SHEET_VARIANTS,
  layerSheet,
  stripFontsImport,
  topLevelLayers,
} from './css-variants.mjs';
import { SERVER_SAFE_MODULES, isServerSafeModule } from './server-safe-modules.mjs';

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

/* Un fichier par module source : chaque module client porte la directive,
   puisqu'un bundler peut n'en garder qu'un. Les modules de
   `server-safe-modules.mjs` ne la portent PAS : côté serveur, elle ferait de
   `ICON_NAMES` une référence client vide. */
const scripts = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return scripts(path);
    return name.endsWith('.js') ? [path] : [];
  });
const emitted = scripts('dist/opale');
check(emitted.includes(join('dist/opale', 'index.js')), 'dist/opale/index.js est absent.');
const USE_CLIENT = /^\s*["']use client["'];/;
for (const file of emitted) {
  const serverSafe = isServerSafeModule(relative('dist/opale', file));
  const directive = USE_CLIENT.test(readFileSync(file, 'utf8'));
  if (serverSafe) {
    check(!directive, `${file} porte "use client" alors qu'il est sans code client.`);
  } else {
    check(directive, `${file} ne commence pas par "use client";`);
  }
}
/* Une entrée de la liste qui ne correspond plus à aucun fichier émis ne
   protège plus rien : un renommage doit la faire suivre. */
for (const modulePath of SERVER_SAFE_MODULES) {
  check(
    emitted.includes(join('dist/opale', `${modulePath}.js`)),
    `dist/opale/${modulePath}.js, déclaré sans "use client", n'est pas émis.`,
  );
}

/* La charte `--tc-*` (`src/tokens`) n'est plus publiée depuis la 4.0.0 :
   seul `--opale-*`, dans `opale.css`, est un contrat public. */
check(!existsSync('dist/tokens'), "dist/tokens existe : la charte `--tc-*` n'est plus publiée.");

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
/* THM-08, THM-16 — les variantes sont la même feuille : en couche, sans
   polices, ou les deux. Chacune est recalculée depuis `opale.css` et comparée
   à l'octet près ; la version en couche n'a qu'une règle de premier niveau,
   `@layer opale`, et garde son `@import` devant, faute de quoi il serait
   ignoré par le navigateur. */
const variants = {};
for (const variant of SHEET_VARIANTS) {
  const path = join('dist/opale', variant);
  check(existsSync(path), `${path} est absent.`);
  variants[variant] = existsSync(path) ? readFileSync(path, 'utf8') : '';
}
const expectedVariants = {
  'opale.layered.css': layerSheet(css),
  'opale-nofonts.css': stripFontsImport(css),
  'opale-nofonts.layered.css': layerSheet(stripFontsImport(css)),
};
for (const [variant, expected] of Object.entries(expectedVariants)) {
  check(variants[variant] === expected, `dist/opale/${variant} ne dérive pas d'opale.css.`);
}
for (const variant of ['opale.layered.css', 'opale-nofonts.layered.css']) {
  let layers = [];
  try {
    layers = topLevelLayers(variants[variant]);
  } catch (error) {
    failures.push(`dist/opale/${variant} : ${error.message}.`);
  }
  check(
    layers.length === 1 && layers[0] === LAYER_NAME,
    `dist/opale/${variant} n'a pas une seule règle de premier niveau @layer ${LAYER_NAME} (${JSON.stringify(layers)}).`,
  );
}
check(
  /^(@charset "[^"]+";\r?\n)?@import '\.\/fonts\.css';\r?\n@layer opale\{/.test(variants['opale.layered.css']),
  "dist/opale/opale.layered.css ne relie pas ses polices avant la couche.",
);
for (const variant of ['opale-nofonts.css', 'opale-nofonts.layered.css']) {
  check(!/@import/.test(variants[variant]), `dist/opale/${variant} importe encore une feuille.`);
}
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
console.log(
  `✓ dist/ livrable : "use client" sur les modules client (${SERVER_SAFE_MODULES.length} modules sans code client épargnés), déclarations nodenext, polices à part, feuilles en couche et sans polices.`,
);
