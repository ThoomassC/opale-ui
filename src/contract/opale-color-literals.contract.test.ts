import postcss, { Rule, type Declaration } from 'postcss';
import { describe, expect, it } from 'vitest';

import { declaration, declarations, stripComments } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   AUCUNE COULEUR LITTÉRALE HORS DES JETONS.

   Une couleur s'écrit une fois, dans un bloc de thème d'`opale.css` ; les
   règles des composants la lisent par un jeton. Une teinte écrite en dur ne
   suit ni le thème sombre ni le thème local de PageScaffold : la coche d'une
   liste multiple restait blanche sur le bleu moyen du sombre.

   Les masques (`mask`, `-webkit-mask`) sont exemptés : ils ne lisent que
   l'alpha de leur dégradé, la teinte n'y est jamais peinte.
   ========================================================================== */

const modules = import.meta.glob<string>('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };
const LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/i;
const THEME_BLOCK = /:root|\[data-opale-page-theme=/;

/** Vrai si la déclaration appartient à un bloc de thème d'`opale.css`. */
function inThemeBlock(file: string, decl: Declaration): boolean {
  return (
    file === 'opale.css' && decl.parent instanceof Rule && THEME_BLOCK.test(decl.parent.selector)
  );
}

describe('les couleurs littérales', () => {
  it('déclare les teintes fixes à la racine', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-glass-light')).toBe('#ffffff');
    expect(root.get('--opale-glass-deep')).toBe('#071c2b');
    expect(root.get('--opale-shade')).toBe('#14100b');
    expect(root.get('--opale-on-accent')).toBe('#241a03');
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const name = file.replace('../opale/components/', '');
    it(`${name} ne peint aucune couleur hors des jetons`, () => {
      const offenders: string[] = [];
      postcss.parse(stripComments(raw)).walkDecls((decl) => {
        if (inThemeBlock(file, decl) || /(^|-)mask$/.test(decl.prop)) return;
        if (LITERAL.test(decl.value)) offenders.push(`${decl.prop}: ${decl.value}`);
      });
      expect(offenders).toEqual([]);
    });
  }

  it('pose l’encre des remplissages sur la coche de la liste multiple', () => {
    const mark = declarations(opaleSource, '.opale-multiselect__mark::after');
    expect(mark.get('border-left')).toBe('2px solid var(--opale-on-primary)');
    expect(mark.get('border-bottom')).toBe('2px solid var(--opale-on-primary)');
  });

  it('pose l’encre des remplissages sur la suggestion choisie de PageScaffold', () => {
    const sheet = modules['../opale/components/page-scaffold/PageScaffold.module.css'];
    expect(declaration(sheet, ".searchSuggestion[aria-selected='true']", 'color')).toBe(
      'var(--opale-on-fill)',
    );
    expect(
      declaration(sheet, ".searchSuggestion[aria-selected='true'] .searchSuggestionGroup", 'color'),
    ).toBe('var(--opale-on-fill)');
  });
});
