import { describe, expect, it } from 'vitest';

import { stripComments } from './stylesheet';

/* ============================================================================
   UN SEUL JEU DE JETONS DANS LES COMPOSANTS.

   SiteNav et SearchBar lisaient l'ancien jeu (`src/tokens`) : `--accent-active`
   teal au lieu du bleu d'Opale, `--space-*` et `--radius-pill` sur d'autres
   échelles, `--glass-*` au lieu du matériau d'Opale. Une application qui
   n'importait qu'`opale.css` les voyait retomber sur des valeurs de repli
   écrites dans le module ; celle qui importait aussi `tokens.css` obtenait une
   barre teal au milieu d'une interface bleue.

   La règle : dans un module de composant, tout `var(--x)` désigne un jeton
   `--opale-*` ou une variable déclarée dans le même fichier.
   ========================================================================== */

const sheets = import.meta.glob('../magic/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('les modules de composants', () => {
  it('existent', () => {
    expect(Object.keys(sheets).length).toBeGreaterThan(5);
  });

  for (const [file, raw] of Object.entries(sheets)) {
    it(`${file.replace('../magic/components/', '')} ne lit que des jetons --opale-* ou les siens`, () => {
      const source = stripComments(raw);
      const declared = new Set([...source.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
      const foreign = [...new Set([...source.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))]
        .filter((name) => !name.startsWith('--opale-') && !declared.has(name))
        .sort();

      expect(foreign, 'jetons étrangers à Opale').toEqual([]);
    });
  }
});
