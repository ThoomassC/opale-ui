import { describe, expect, it } from 'vitest';

import { declaration } from '../test/css-rules';
import { stripComments } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   UNE ÉCHELLE TYPOGRAPHIQUE.

   L'audit comptait vingt tailles de police, toutes en dur — dont trois à moins
   d'un pixel l'une de l'autre (0,8 / 0,8125 / 0,82 rem) — et huit hauteurs de
   ligne. Deux composants voisins ne pouvaient pas « tomber juste » ensemble.

   La règle : une taille est un jeton `--opale-text-*` (ou `inherit`, ou un
   `clamp()` de titre fluide) ; une hauteur de ligne est un jeton
   `--opale-leading-*`, ou `1` pour une boîte de glyphe.
   ========================================================================== */

const modules = import.meta.glob('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };

const SIZE = /^(var\(--opale-text-(xs|sm|md|lg|xl|2xl)\)|inherit|clamp\(.+\)|var\(--[\w-]+\))$/;
const LEADING = /^(var\(--opale-leading-(tight|snug|relaxed)\)|1|inherit|normal)$/;

describe('l’échelle typographique', () => {
  it.each([
    ['--opale-text-xs', '0.75rem'],
    ['--opale-text-sm', '0.875rem'],
    ['--opale-text-md', '1rem'],
    ['--opale-text-lg', '1.25rem'],
    ['--opale-text-xl', '1.5rem'],
    ['--opale-text-2xl', '2rem'],
    ['--opale-leading-tight', '1.1'],
    ['--opale-leading-snug', '1.4'],
    ['--opale-leading-relaxed', '1.6'],
  ])('déclare %s à %s à la racine', (token, value) => {
    expect(declaration(opaleSource, ':root', token)).toBe(value);
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const source = stripComments(raw);
    const name = file.replace('../opale/components/', '');
    const declared = new Set([...source.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    const sizes: string[] = [];
    const leadings: string[] = [];

    for (const [, value] of source.matchAll(/font-size:\s*([^;]+);/g)) sizes.push(value.trim());
    for (const [, value] of source.matchAll(/line-height:\s*([^;]+);/g))
      leadings.push(value.trim());
    /* Le raccourci `font: 600 0.875rem/1.75 …` porte les deux. */
    for (const [, value] of source.matchAll(/(?<![\w-])font:\s*([^;]+);/g)) {
      const parts =
        /(var\(--opale-text-[\w-]+\)|[\d.]+r?em)(?:\s*\/\s*(var\(--opale-leading-[\w-]+\)|[\d.]+))?/.exec(
          value,
        );
      if (parts) {
        sizes.push(parts[1]);
        if (parts[2]) leadings.push(parts[2]);
      }
    }

    it(`${name} prend ses tailles dans l’échelle`, () => {
      for (const value of sizes) {
        const local = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
        if (local && !local.startsWith('--opale-')) expect(declared.has(local), value).toBe(true);
        expect(value, `taille hors échelle dans ${name}`).toMatch(SIZE);
      }
    });

    it(`${name} prend ses hauteurs de ligne dans l’échelle`, () => {
      for (const value of leadings)
        expect(value, `interligne hors échelle dans ${name}`).toMatch(LEADING);
    });
  }
});
