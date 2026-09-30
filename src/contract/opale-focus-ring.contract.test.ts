import { describe, expect, it } from 'vitest';

import { declaration, declarations } from '../test/css-rules';
import { stripComments } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   UN SEUL ANNEAU DE FOCUS.

   L'audit en comptait cinq : 2 ou 3 px, décalés de -4 à 4 px, selon le
   composant. Les liens de SiteNav n'en avaient aucun — seule leur couleur
   changeait —, et SearchBar éteignait le halo du verre pour ne garder qu'un
   filet de bordure de 1 px.

   La règle : tout `outline` visible prend sa largeur dans
   `--opale-focus-ring-width` et son décalage dans `--opale-focus-ring-offset`
   (ou son opposé, pour un anneau intérieur). Seule la couleur varie : le bleu
   de focus, l'encre du verre ou `currentColor` sur un remplissage.
   ========================================================================== */

const modules = import.meta.glob('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };
const WIDTH = 'var(--opale-focus-ring-width)';
const OFFSETS = ['var(--opale-focus-ring-offset)', 'calc(var(--opale-focus-ring-width) * -1)'];

describe('l’anneau de focus', () => {
  it('déclare sa largeur et son décalage à la racine', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-focus-ring-width')).toBe('3px');
    expect(root.get('--opale-focus-ring-offset')).toBe('3px');
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const source = stripComments(raw);
    const outlines = [...source.matchAll(/(?<![\w-])outline:\s*([^;]+);/g)]
      .map((m) => m[1].trim())
      .filter((value) => !/^(none|0)$/.test(value));
    const offsets = [...source.matchAll(/outline-offset:\s*([^;]+);/g)].map((m) => m[1].trim());
    const name = file.replace('../opale/components/', '');

    if (outlines.length) {
      it(`${name} trace ses anneaux à la largeur commune`, () => {
        for (const value of outlines) expect(value.startsWith(`${WIDTH} solid `), value).toBe(true);
      });
    }
    if (offsets.length) {
      it(`${name} décale ses anneaux du pas commun`, () => {
        for (const value of offsets) expect(OFFSETS, value).toContain(value);
      });
    }
  }

  it('dessine un anneau sur les liens de SiteNav', () => {
    const css = modules['../opale/components/site-nav/site-nav.module.css'];
    expect(declaration(css, '.link:focus-visible', 'outline')).toMatch(
      /^var\(--opale-focus-ring-width\) solid /,
    );
  });

  it('dessine un anneau autour de SearchBar au clavier', () => {
    const css = modules['../opale/components/search-bar/style/SearchBar.module.scss'];
    expect(declaration(css, '.root:has(.input:focus-visible)', 'outline')).toMatch(
      /^var\(--opale-focus-ring-width\) solid /,
    );
  });
});
