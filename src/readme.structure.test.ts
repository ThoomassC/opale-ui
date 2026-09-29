import { describe, expect, it } from 'vitest';

import { Opale } from './opale';
import { CATALOG } from './opale/catalog';
import { INSTALL_REF } from './showcase/install-ref';
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
  it('annonce le nombre réel de composants du namespace Opale', () => {
    expect(readme).toContain(`**${Object.keys(Opale).length} composants**`);
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

  it('décrit le paquet sans nommer les applications qui le consomment', () => {
    expect(manifest.description).not.toMatch(/portfolio|travels_in_world/i);
    expect(readme).not.toMatch(/travels_in_world/);
  });
});
