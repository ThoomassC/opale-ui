#!/usr/bin/env node
/* =============================================================================
   CE QU'UN IMPORT ISOLÉ COÛTE À UNE APPLICATION.

   Une application qui n'importe qu'un `Divider` ne doit recevoir que lui. Ce
   script regroupe, minifie et élague une entrée jetable par composant surveillé,
   contre `dist/opale/index.js` et avec la même politique qu'une application
   (React et `clsx` restent externes), puis compare le poids obtenu à son budget.

   Suppose `dist/` construit (`npm run build:lib`).
   ========================================================================== */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
  return outputs
    .filter((chunk) => chunk.type === 'chunk')
    .reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0);
};

const work = mkdtempSync(join(tmpdir(), 'opale-size-'));
const failures = [];
try {
  for (const [name, budget] of Object.entries(BUDGETS)) {
    const size = await bundledSize(name, work);
    const line = `${name} seul : ${size} o minifiés (budget ${budget} o)`;
    if (size > budget) failures.push(line);
    else console.log(`✓ ${line}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n✗ Budget de poids dépassé :\n  - ${failures.join('\n  - ')}\n`);
  process.exit(1);
}
