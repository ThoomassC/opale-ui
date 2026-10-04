import { describe, expect, it } from 'vitest';

import { parseRules } from '../test/css-rules';
import docSource from './doc.css?raw';
import docV3Source from './doc-v3.css?raw';
import docDaSource from './doc-da.css?raw';

/* =============================================================================
   LES CLASSES QUE PLUS RIEN NE REND NE REVIENNENT PAS DANS LES FEUILLES.

   Chacune a été vérifiée sans référence dans `src/**\/*.{ts,tsx}` (hors tests et
   commentaires) avant d'être retirée. Une règle morte n'est pas inoffensive :
   elle se lit comme un contrat, et deux gardes la tenaient encore en vie à
   elle seule. La correspondance est faite sur la classe ENTIÈRE —
   `.tc-doc-install` est un préfixe de `.tc-doc-install-status`, bien vivant.

   `.tc-doc-main--home` n'est plus posé par `doc-shell.tsx` : la page de secours
   prend l'habillage des pages internes. Seule la forme
   `:not(.tc-doc-main--home)` le cite encore, toujours vraie, gardée telle quelle
   pour ne pas changer la spécificité de ces règles.
   ========================================================================== */

const SHEETS = { 'doc.css': docSource, 'doc-v3.css': docV3Source, 'doc-da.css': docDaSource };

const REMOVED = [
  'tc-doc-mobile-nav-toggle',
  'tc-doc-nav__all',
  'tc-doc-nav__alltitle',
  'tc-doc-nav__groupnote',
  'tc-doc-install',
  'tc-doc-specimen__header',
  'tc-doc-specimen__eyebrow',
  'tc-doc-opale-demo__carousel',
  'tc-doc-opale-demo__scroll',
  'tc-doc-opale-demo__page',
  'tc-doc-page-scaffold-section',
  'tc-doc-shell',
  'tc-doc-page__lede',
  'tc-doc-search__glyph',
  'tc-doc-scale__sample--family',
  'tc-doc-scale__stack',
  'tc-doc-home',
  'tc-doc-release-callout',
] as const;

/** Vrai si `selector` cite la classe entière `name`, ou une classe qui en dérive par `__`/`--`. */
const cites = (selector: string, name: string): boolean =>
  new RegExp(`\\.${name}(?:(?:__|--)[\\w-]+)?(?![\\w-])`).test(
    selector.replace(/:not\(\.tc-doc-main--home\)/g, ''),
  );

const selectors = (source: string): readonly string[] =>
  parseRules(source).flatMap((rule) => rule.selectors);

describe('les règles mortes de la vitrine', () => {
  for (const [file, source] of Object.entries(SHEETS)) {
    it(`${file} ne cite plus aucune classe retirée`, () => {
      const offenders = selectors(source).filter((selector) =>
        REMOVED.some((name) => cites(selector, name)),
      );
      expect(offenders).toEqual([]);
    });

    it(`${file} ne lit plus l’ancien attribut d’ouverture du sommaire`, () => {
      expect(selectors(source).filter((s) => s.includes('.tc-doc-nav[data-open'))).toEqual([]);
    });

    it(`${file} ne garde de l’accueil que l’exclusion des pages internes`, () => {
      const home = selectors(source).filter((s) => s.includes('.tc-doc-main--home'));
      for (const selector of home) {
        expect(selector, selector).toMatch(/:not\(\.tc-doc-main--home\)/);
        expect(selector.replace(/:not\(\.tc-doc-main--home\)/g, '')).not.toContain(
          '.tc-doc-main--home',
        );
      }
    });
  }

  it('garde vivante la pastille d’installation, dont le nom prolonge une classe retirée', () => {
    expect(selectors(docV3Source)).toContain('.tc-doc-install-status');
  });
});
