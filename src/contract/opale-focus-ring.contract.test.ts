import { describe, expect, it } from 'vitest';

import { ruleBodies, stripComments } from './stylesheet';
import opaleSource from '../magic/opale.css?raw';

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

const modules = import.meta.glob('../magic/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };
const WIDTH = 'var(--opale-focus-ring-width)';
const OFFSETS = ['var(--opale-focus-ring-offset)', 'calc(var(--opale-focus-ring-width) * -1)'];

describe('l’anneau de focus', () => {
  it('déclare sa largeur et son décalage à la racine', () => {
    const root = ruleBodies(stripComments(opaleSource), ':root').join('\n');
    expect(root).toMatch(/--opale-focus-ring-width:\s*3px/);
    expect(root).toMatch(/--opale-focus-ring-offset:\s*3px/);
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const source = stripComments(raw);
    const outlines = [...source.matchAll(/(?<![\w-])outline:\s*([^;]+);/g)]
      .map((m) => m[1].trim())
      .filter((value) => !/^(none|0)$/.test(value));
    const offsets = [...source.matchAll(/outline-offset:\s*([^;]+);/g)].map((m) => m[1].trim());
    const name = file.replace('../magic/components/', '');

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
    const css = stripComments(modules['../magic/components/site-nav/site-nav.module.css']);
    expect(ruleBodies(css, '.link:focus-visible').join('\n')).toMatch(/outline:\s*var\(--opale-focus-ring-width\)/);
  });

  it('dessine un anneau autour de SearchBar au clavier', () => {
    const css = stripComments(modules['../magic/components/search-bar/style/SearchBar.module.scss']);
    expect(ruleBodies(css, '.root:has(.input:focus-visible)').join('\n')).toMatch(
      /outline:\s*var\(--opale-focus-ring-width\)/,
    );
  });
});
