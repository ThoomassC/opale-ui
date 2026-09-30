import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/* =============================================================================
   UN COMPOSANT QUI DESSINE UNE CROIX N'EMBARQUE PAS LE CATALOGUE.

   MESURÉ AVANT CE GARDE : une application qui n'importait que `Modal`
   recevait `icons.js` entier — plus de 11 ko minifiés, les cent vingt dessins
   du jeu — parce que `IconGlyph` demandait sa croix PAR SON NOM, donc à la
   table qui les contient toutes.

   LE GARDE REGROUPE LE MODULE COMME LE FERAIT UNE APPLICATION — esbuild, avec
   l'élagage et le `sideEffects` du `package.json` du dépôt — et regarde quels
   fichiers du jeu d'icônes ont laissé des octets dans le résultat. Un import
   ajouté plus tard vers `../icon` (le baril) ou vers `IconGlyph` ferait
   revenir le catalogue ; ce test le dirait, là où une relecture ne le verrait
   pas.

   L'EXÉCUTABLE ET NON L'API JAVASCRIPT D'ESBUILD : sous jsdom, l'API refuse de
   démarrer (le `TextEncoder` de jsdom ne rend pas un `Uint8Array` de Node), et
   l'environnement `node` n'est pas possible ici, `src/test/setup.ts` touchant
   `window`.
   ========================================================================== */

const OPALE = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ESBUILD = resolve(OPALE, '../../node_modules/.bin/esbuild');

interface Metafile {
  outputs: Record<string, { inputs: Record<string, { bytesInOutput: number }> }>;
}

/** Les modules du jeu d'icônes qui laissent au moins un octet dans le paquet de `entry`. */
function iconModulesKeptBy(entry: string, name: string): string[] {
  const work = mkdtempSync(join(tmpdir(), 'opale-icon-graph-'));
  try {
    execFileSync(
      ESBUILD,
      [
        '--bundle',
        '--format=esm',
        '--platform=browser',
        '--log-level=error',
        '--loader=ts',
        '--loader:.css=empty',
        '--loader:.scss=empty',
        '--jsx=automatic',
        ...['react', 'react-dom', 'react/*', 'react-dom/*', 'clsx'].map((id) => `--external:${id}`),
        `--metafile=${join(work, 'meta.json')}`,
        `--outfile=${join(work, 'out.js')}`,
      ],
      {
        cwd: OPALE,
        input: `import { ${name} } from ${JSON.stringify(entry)};\nconsole.log(${name});\n`,
      },
    );
    const metafile = JSON.parse(readFileSync(join(work, 'meta.json'), 'utf8')) as Metafile;
    const [output] = Object.values(metafile.outputs);
    return Object.entries(output?.inputs ?? {})
      .filter(([file, { bytesInOutput }]) => file.includes('components/icon/') && bytesInOutput > 0)
      .map(([file]) => file.replace(/.*components\/icon\//, ''))
      .sort();
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

describe('le graphe d’un composant qui dessine une icône fixe', () => {
  it('Modal ne devrait garder que sa croix, pas le catalogue', () => {
    const kept = iconModulesKeptBy('./components/modal', 'Modal');

    expect(kept).not.toContain('icons.ts');
    expect(kept).toEqual(['IconPaths.tsx', 'glyphs.ts']);
  });

  /* LE CONTRE-TÉMOIN. Sans lui, un garde qui ne trouverait jamais `icons.ts` —
     chemin mal écrit, métafichier mal lu — passerait toujours. `IconGlyph`
     prend un nom, il a besoin de la table : il doit la garder. */
  it('IconGlyph, qui prend un nom, devrait garder le catalogue', () => {
    const kept = iconModulesKeptBy('./components/icon/IconGlyph.tsx', 'IconGlyph');

    expect(kept).toContain('icons.ts');
  });
});
