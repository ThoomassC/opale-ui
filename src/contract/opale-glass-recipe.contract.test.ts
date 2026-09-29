import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import { declaration, declarations, stripComments } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   UNE SEULE RECETTE DE VERRE LIQUIDE.

   Le matériau `Glass`, la goutte du curseur et la bulle de SiteNav regardent
   derrière eux avec le même filtre : `--opale-glass-backdrop-blur` et
   `--opale-glass-saturate`. Seul le voile des dialogues floute autrement —
   il ne réfracte pas, il éloigne la page (`--opale-scrim-blur`).
   ========================================================================== */

const modules = import.meta.glob<string>('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };
const RECIPE = 'blur(var(--opale-glass-backdrop-blur)) saturate(var(--opale-glass-saturate))';
const SCRIM = 'blur(var(--opale-scrim-blur))';

describe('la recette du verre', () => {
  it('déclare flou et saturation à la racine', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-glass-backdrop-blur')).toBe('0.75px');
    expect(root.get('--opale-glass-saturate')).toBe('1.08');
  });

  it.each([
    ['.refraction', modules['../opale/components/glass/style/Glass.module.css']],
    ['.opale-range-bubble', opaleSource],
    ['.bubble', modules['../opale/components/site-nav/liquid-bubble.module.css']],
  ])('%s suit la recette', (selector, source) => {
    expect(declaration(source, selector, 'backdrop-filter')).toBe(RECIPE);
    expect(declaration(source, selector, '-webkit-backdrop-filter')).toBe(RECIPE);
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const name = file.replace('../opale/components/', '');
    it(`${name} ne compose aucun autre filtre d’arrière-plan`, () => {
      const offenders: string[] = [];
      postcss.parse(stripComments(raw)).walkDecls(/backdrop-filter$/, (decl) => {
        const value = decl.value.replace(/\s+/g, ' ');
        if (value !== RECIPE && value !== SCRIM && value !== 'none') {
          offenders.push(`${decl.prop}: ${value}`);
        }
      });
      expect(offenders).toEqual([]);
    });
  }
});
