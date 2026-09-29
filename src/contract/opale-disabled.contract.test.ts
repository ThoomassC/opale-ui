import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import { declarations, stripComments } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   UNE SEULE OPACITÉ POUR L'ÉTAT DÉSACTIVÉ.

   Un contrôle désactivé s'efface de `--opale-disabled-opacity`, quel qu'il
   soit : bouton, onglet, pagination, zone de dépôt. Deux contrôles voisins
   désactivés ont ainsi la même présence.
   ========================================================================== */

const modules = import.meta.glob<string>('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };
const DISABLED = /:disabled|\[aria-disabled='true'\]|\[data-disabled='true'\]|\.disabled\b/;
const TOKEN = 'var(--opale-disabled-opacity)';

/** Chaque `opacity` posée par une règle d'état désactivé, avec son sélecteur. */
function disabledOpacities(source: string): Array<[string, string]> {
  const found: Array<[string, string]> = [];
  postcss.parse(stripComments(source)).walkRules((rule) => {
    const selectors = rule.selectors.filter((selector) => DISABLED.test(selector.replace(/:not\([^)]*\)/g, '')));
    if (selectors.length === 0) return;
    rule.walkDecls('opacity', (decl) => {
      for (const selector of selectors) found.push([selector, decl.value.trim()]);
    });
  });
  return found;
}

describe('l’état désactivé', () => {
  it('déclare son opacité à la racine', () => {
    expect(declarations(opaleSource, ':root').get('--opale-disabled-opacity')).toBe('0.5');
  });

  it('couvre les contrôles attendus', () => {
    const selectors = Object.values(sheets).flatMap((source) =>
      disabledOpacities(source).map(([selector]) => selector),
    );
    expect(selectors).toEqual(
      expect.arrayContaining([
        '.opale-button:disabled',
        '.opale-pagination button:disabled',
        '.opale-dropzone[data-disabled=\'true\']',
        '.tabsTrigger:disabled',
        '.plainTrigger:disabled',
      ]),
    );
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const found = disabledOpacities(raw);
    if (found.length === 0) continue;
    const name = file.replace('../opale/components/', '');
    it(`${name} s’efface de l’opacité commune`, () => {
      for (const [selector, value] of found) expect(value, selector).toBe(TOKEN);
    });
  }
});
