#!/usr/bin/env node
/* =============================================================================
   CE QU'UN IMPORT ISOLÉ COÛTE À UNE APPLICATION.

   Une application qui n'importe qu'un `Divider` ne doit recevoir que lui. Ce
   script regroupe, minifie et élague une entrée jetable par composant surveillé,
   contre `dist/opale/index.js` et avec la même politique qu'une application
   (React et `clsx` restent externes), puis compare le poids obtenu à son budget.

   Suppose `dist/` construit (`npm run build:lib`).
   ========================================================================== */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';

import { build } from 'vite';

const root = resolve(import.meta.dirname, '..');
const entry = join(root, 'dist/opale/index.js');

/* Le poids minifié toléré pour chaque import isolé, en octets. Mesuré à
   266 o pour `Divider` (47 056 o quand le paquet était un fichier unique) :
   le budget laisse la marge d'une évolution du composant, pas celle d'un
   module voisin entraîné avec lui. */
const BUDGETS = {
  Divider: 1_000,
  /* Le carrousel : défilement natif, glisser à la souris, clavier, lecture
     automatique et annonces. Posé à 5 000 o avant son écriture, mesuré à
     8 723 o puis allégé à 7 342 o (flèches en texte, une seule fabrique de
     classes, préférence de mouvement sans abonnement). 5 000 o ne tiennent
     pas : la mesure garde l'indentation de la sortie `es`, et Tooltip,
     Textarea et RadioGroup pèsent 11,3 à 11,5 ko par le même calcul.
     Relevé une seconde fois, à 10 500 o, après la revue : la mesure continue
     (ResizeObserver), les positions atteignables et le glisser durci
     corrigent deux bloquants et cinq défauts majeurs, pour 10 069 o.
     Puis à 11 000 o : les fragments dépliés et l'avertissement d'un enfant
     qui cache ses diapositives (un troisième bloquant, vu en navigateur)
     portent la mesure à 10 723 o — toujours sous Tooltip, Textarea et
     RadioGroup. Un nouvel ajout passe par un allègement, pas par ce budget. */
  Carousel: 11_000,
  /* L'apparition au défilement : une animation CSS liée à la vue, et un
     repli `IntersectionObserver` pour les seuls éléments sous la ligne de
     flottaison. Posé à 2 500 o avant son écriture ; un dépassement s'allège,
     il ne relève pas ce budget. */
  Reveal: 2_500,
  /* Le bandeau défilant : une animation CSS sur deux copies, un bouton pause
     et la direction lue une fois. Posé à 3 000 o avant son écriture ; un
     dépassement s'allège, il ne relève pas ce budget. */
  Marquee: 3_000,
  /* Le titre découpé en mots : des mots en `inline-block`, une copie lisible
     cachée de l'écran et un observateur pour le déclencheur `view`. Posé à
     2 500 o avant son écriture ; un dépassement s'allège, il ne relève pas
     ce budget. */
  SplitHeading: 2_500,
  /* La scène qui suit le fond de la section active : ses sections mesurées
     à chaque image de défilement, et l'attribut `data-ground` qu'une feuille
     lit. Posé à 2 000 o avant son écriture ; un dépassement s'allège, il ne
     relève pas ce budget — la réécriture sans observateur, mesurée à 2 549 o,
     a été allégée à 1 993 o. */
  ScrollStage: 2_000,
  /* La section qui peint son propre fond et son encre, et s'inscrit auprès
     de sa scène. Posé à 1 200 o avant son écriture ; même règle. */
  ScrollSection: 1_200,
  /* La carte SVG : régions au clavier, gestes, vue animée, infobulle et ses
     commandes. Mesurée à 47 197 o avant l'écriture de `WorldMap` — elle
     emporte `IconActionButton` et `Surface` ; le budget est la mesure plus
     5 %, pour qu'une extraction partagée avec `WorldMap` ne l'alourdisse pas
     sans qu'on le voie. */
  SvgMap: 49_557,
  /* La carte du monde : plan, globe, imagerie, niveaux de détail et repères.
     Posé à 30 000 o avant son écriture, puis à 50 000 o : ses commandes
     emportent `IconActionButton` et `Surface`, qui pèsent à eux seuls près de
     27 ko dans `SvgMapControls`. Un dépassement s'allège, il ne relève pas
     ce budget. Le globe et l'imagerie, chargés à la demande, ont leurs
     propres budgets (`LAZY_BUDGETS`). */
  WorldMap: 50_000,
};

/* Les budgets posés AVANT leur composant : tant qu'il n'est pas exporté, la
   mesure est sautée et le dit. Un nom qui manque sans figurer ici fait échouer
   le script — une coquille ne doit pas passer pour un budget tenu. Le nom sort
   de cette liste le jour où le composant est exporté. */
const RESERVED = new Set([]);

/* =============================================================================
   CE QU'UN COMPOSANT NE CHARGE QU'À LA DEMANDE.

   Le budget d'un composant mesure son CHARGEMENT INITIAL : le morceau
   d'entrée et ce qu'il importe statiquement. Un module qu'il importe par
   `import()` — le globe et l'imagerie de `WorldMap`, chargés au premier
   usage — sort de cette mesure et a son propre budget, ci-dessous : le
   morceau dynamique et ce qu'il est seul à importer, sans ce que l'entrée
   apporte déjà. Plusieurs modules d'un même groupe se mesurent ensemble.

   Un module déclaré ici DOIT être un morceau dynamique du composant : s'il
   est importé statiquement, le script échoue — c'est ce qui garde la
   frontière paresseuse. Les chemins sont ceux de `dist/opale`, sans
   extension ; un module absent de `dist/` fait aussi échouer le script. */
const LAZY_BUDGETS = {
  WorldMap: [
    /* Le globe vectoriel : découpe par l'horizon, graticule, limbe. Posé à
       20 000 o avant son écriture ; un dépassement s'allège. */
    { label: 'globe vectoriel', budget: 20_000, modules: ['components/world-map/GlobeLayer'] },
    /* L'imagerie : tuiles en plan, texture du globe et son échantillonnage.
       Posé à 20 000 o avant son écriture ; même règle. */
    /* Les étiquettes des pays et des villes, et la mesure des commandes
       qu'elles contournent : elles ne paraissent qu'avec les données, qui
       arrivent après le premier rendu, et se chargent avec elles. Posé à
       6 000 o avant leur extraction, quand la revue a porté le chargement
       initial à 51 964 o ; un dépassement s'allège. */
    { label: 'étiquettes', budget: 6_000, modules: ['components/world-map/LabelLayer'] },
    {
      label: 'imagerie satellite',
      budget: 20_000,
      modules: ['components/world-map/FlatRaster', 'components/world-map/GlobeRaster'],
    },
  ],
};

const EXTERNAL = [/^react(\/.*)?$/, /^react-dom(\/.*)?$/, 'clsx'];

const bundledSize = async (name, work) => {
  const input = join(work, `${name}.js`);
  writeFileSync(input, `import { ${name} } from ${JSON.stringify(entry)};\nexport { ${name} };\n`);
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    root: work,
    build: {
      write: false,
      minify: true,
      lib: { entry: input, formats: ['es'], fileName: () => `${name}.js` },
      rollupOptions: { external: EXTERNAL },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output);
  const chunks = new Map(
    outputs.filter((chunk) => chunk.type === 'chunk').map((chunk) => [chunk.fileName, chunk]),
  );
  /* Un morceau et ceux qu'il importe statiquement, de proche en proche. */
  const closure = (fileName, into = new Set()) => {
    if (into.has(fileName) || !chunks.has(fileName)) return into;
    into.add(fileName);
    for (const imported of chunks.get(fileName).imports) closure(imported, into);
    return into;
  };
  const weigh = (names) =>
    [...names].reduce((total, file) => total + Buffer.byteLength(chunks.get(file).code), 0);
  const initial = new Set();
  for (const chunk of chunks.values()) if (chunk.isEntry) closure(chunk.fileName, initial);
  /* Le morceau dynamique d'un module de `dist/opale`, s'il y en a un. */
  const lazyChunk = (modulePath) =>
    [...chunks.values()].find(
      (chunk) =>
        chunk.isDynamicEntry &&
        chunk.facadeModuleId === join(root, 'dist/opale', `${modulePath}.js`),
    );
  return {
    size: weigh(initial),
    /** Le poids d'un groupe chargé à la demande ; `null` si un module n'est pas dynamique. */
    lazySize: (modules) => {
      const group = new Set();
      for (const modulePath of modules) {
        const chunk = lazyChunk(modulePath);
        if (!chunk) return null;
        closure(chunk.fileName, group);
      }
      for (const file of initial) group.delete(file);
      return weigh(group);
    },
  };
};

/* Les noms exportés par l'entrée construite, lus sans l'exécuter : les
   `export { … }` de l'entrée construite. */
const exportedNames = new Set(
  [...readFileSync(entry, 'utf8').matchAll(/export\s*\{([^}]*)\}/g)].flatMap(([, list]) =>
    list.split(',').map(
      (item) =>
        item
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim() ?? '',
    ),
  ),
);

const work = mkdtempSync(join(tmpdir(), 'opale-size-'));
const failures = [];
try {
  for (const [name, budget] of Object.entries(BUDGETS)) {
    if (RESERVED.has(name)) {
      if (exportedNames.has(name)) {
        failures.push(`${name} est exporté : retirez-le de RESERVED pour mesurer son budget`);
      } else {
        console.log(`· ${name} : budget réservé (${budget} o), composant pas encore exporté`);
      }
      continue;
    }
    const { size, lazySize } = await bundledSize(name, work);
    const line = `${name} seul : ${size} o minifiés (budget ${budget} o)`;
    if (size > budget) failures.push(line);
    else console.log(`✓ ${line}`);
    for (const { label, budget: lazyBudget, modules } of LAZY_BUDGETS[name] ?? []) {
      /* Le composant est exporté : un module de son groupe qui manque à
         `dist/` est un échec, pas un budget réservé — sinon un renommage
         ferait passer le groupe pour tenu sans rien mesurer. */
      const absent = modules.filter(
        (modulePath) => !existsSync(join(root, 'dist/opale', `${modulePath}.js`)),
      );
      if (absent.length > 0) {
        failures.push(`${name}, ${label} : ${absent.join(', ')} absent de dist/opale`);
        continue;
      }
      const lazy = lazySize(modules);
      if (lazy === null) {
        failures.push(`${name}, ${label} : ${modules.join(', ')} n'est pas chargé à la demande`);
        continue;
      }
      const lazyLine = `${name}, ${label} à la demande : ${lazy} o minifiés (budget ${lazyBudget} o)`;
      if (lazy > lazyBudget) failures.push(lazyLine);
      else console.log(`✓ ${lazyLine}`);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n✗ Budget de poids dépassé :\n  - ${failures.join('\n  - ')}\n`);
  process.exit(1);
}
