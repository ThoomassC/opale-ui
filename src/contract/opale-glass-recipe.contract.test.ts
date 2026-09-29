import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import { declaration, declarations, stripComments } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   DEUX RECETTES DE VERRE, NOMMÉES.

   Le matériau `Glass` et la goutte du curseur réfractent :
   `--opale-glass-backdrop-blur` et `--opale-glass-saturate`. La bulle de
   SiteNav est un verre dépoli, qui floute franchement pour rester lisible sur
   une photographie : `--opale-glass-frost-*`. Le voile des dialogues, lui,
   éloigne la page (`--opale-scrim-blur`). Aucun autre filtre n'est permis.
   ========================================================================== */

const modules = import.meta.glob<string>('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };
const RECIPE = 'blur(var(--opale-glass-backdrop-blur)) saturate(var(--opale-glass-saturate))';
const FROST = 'blur(var(--opale-glass-frost-blur)) saturate(var(--opale-glass-frost-saturate))';
const SCRIM = 'blur(var(--opale-scrim-blur))';

describe('la recette du verre', () => {
  it('déclare flou et saturation à la racine', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-glass-backdrop-blur')).toBe('0.75px');
    expect(root.get('--opale-glass-saturate')).toBe('1.08');
    expect(root.get('--opale-glass-frost-blur')).toBe('12px');
    expect(root.get('--opale-glass-frost-saturate')).toBe('1.45');
  });

  it.each([
    ['.refraction', modules['../opale/components/glass/style/Glass.module.css']],
    ['.opale-range-bubble', opaleSource],
  ])('%s suit la recette de réfraction', (selector, source) => {
    expect(declaration(source, selector, 'backdrop-filter')).toBe(RECIPE);
    expect(declaration(source, selector, '-webkit-backdrop-filter')).toBe(RECIPE);
  });

  it('la bulle de SiteNav suit la recette dépolie', () => {
    const bubble = modules['../opale/components/site-nav/liquid-bubble.module.css'];
    expect(declaration(bubble, '.bubble', 'backdrop-filter')).toBe(FROST);
    expect(declaration(bubble, '.bubble', '-webkit-backdrop-filter')).toBe(FROST);
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const name = file.replace('../opale/components/', '');
    it(`${name} ne compose aucun autre filtre d’arrière-plan`, () => {
      const offenders: string[] = [];
      postcss.parse(stripComments(raw)).walkDecls(/backdrop-filter$/, (decl) => {
        const value = decl.value.replace(/\s+/g, ' ');
        if (value !== RECIPE && value !== FROST && value !== SCRIM && value !== 'none') {
          offenders.push(`${decl.prop}: ${value}`);
        }
      });
      expect(offenders).toEqual([]);
    });
  }
});
