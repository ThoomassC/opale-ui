import { describe, expect, it } from 'vitest';

import { Opale } from './opale';
import { CATALOG } from './opale/catalog';
import { INSTALL_REF, INSTALL_REF_KIND, releaseArchiveUrl } from './showcase/install-ref';
import primitivesSource from './tokens/primitives.css?raw';
import readme from '../README.md?raw';
import manifest from '../package.json';

/* =============================================================================
   LES CHIFFRES DU README VIENNENT DU CODE.

   Le README annonçait « 77 entrées » de catalogue quand il en restait 52, et
   « 92 primitives » pour 54. Un nombre écrit à la main dérive sans bruit :
   chacun est ici recalculé depuis la source qu'il décrit.
   ========================================================================== */

const primitives = new Set(
  [...primitivesSource.matchAll(/(--tc-[a-z]+-\d+)\s*:/g)].map((match) => match[1]),
);

describe('le README', () => {
  /* DOCS-02 — des composants distincts, pas des clés : `Opale.Background` est
     un alias déprécié de `BackgroundSurface`, le compter annonçait 62 pour 61. */
  it('annonce le nombre réel de composants du namespace Opale', () => {
    expect(readme).toContain(`**${new Set(Object.values(Opale)).size} composants**`);
  });

  it('annonce le nombre réel de fiches du catalogue', () => {
    expect(readme).toContain(`**${CATALOG.length} fiches**`);
  });

  it('annonce le nombre réel de primitives de la charte', () => {
    expect(readme).toContain(`**${primitives.size} primitives**`);
  });

  it('installe le tag que propose la page Installation', () => {
    expect(readme).toContain(`github:ThoomassC/opale-ui#${INSTALL_REF}`);
  });

  /* Le README voyage dans l'archive : sa commande recommandée doit être celle
     de la page Installation, archive comprise, et il n'en cite pas d'autre. */
  it('recommande l’archive que propose la page Installation, et aucune autre', () => {
    const archive = releaseArchiveUrl(INSTALL_REF, INSTALL_REF_KIND);
    const cited = [...readme.matchAll(/releases\/download\/[^\s)`]+\.tgz/g)].map((m) => m[0]);
    if (archive) {
      expect(readme).toContain(`npm i ${archive}`);
      expect(new Set(cited)).toEqual(
        new Set([archive.slice(archive.indexOf('releases/download'))]),
      );
    } else {
      expect(cited).toEqual([]);
    }
    const tags = new Set([...readme.matchAll(/opale-ui#(v\d+\.\d+\.\d+)/g)].map((m) => m[1]));
    expect(tags).toEqual(new Set([INSTALL_REF]));
  });

  it('ne dit plus que la feuille publiée est non minifiée', () => {
    expect(readme).not.toMatch(/n'est pas minifié/);
  });

  it('décrit le paquet sans nommer les applications qui le consomment', () => {
    expect(manifest.description).not.toMatch(/portfolio|travels_in_world/i);
    expect(readme).not.toMatch(/travels_in_world/);
  });
});
