import { describe, expect, it } from 'vitest';

import { declaration, parseRules } from '../test/css-rules';
import topbarSource from '../opale/components/topbar/style/Topbar.module.css?raw';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   SOUS 30 REM D'ÉCRAN, LA BARRE ET LA CARTE CHANGENT DE DISPOSITION — ET
   SEULEMENT LÀ.

   À 320 px, le titre de la barre tombait à zéro pixel et « Publier »
   recouvrait le badge ; l'invite et les commandes de la carte en couvraient
   plus de la moitié. Les corrections vivent dans un bloc `@media` : sorties
   de ce bloc, elles changeraient la disposition sur un écran large — ce qu'un
   correctif de 3.x s'interdit.

   ET AUCUN DES DEUX N'EST UN CONTENEUR. Un `container-type` sur la barre ou la
   carte changerait la cible des requêtes `@container` anonymes écrites dans
   leur contenu — `PageScaffold` en écrit quatre, qui mesureraient alors
   l'en-tête au lieu de sa propre racine.
   ========================================================================== */

const NARROW = '@media (max-width: 30rem)';

describe('la barre étroite', () => {
  it('passe à la ligne, étire ses actions et garde un titre, sous 30 rem', () => {
    expect(declaration(topbarSource, '.topbar', 'flex-wrap', { within: NARROW })).toBe('wrap');
    expect(declaration(topbarSource, '.actions', 'flex-grow', { within: NARROW })).toBe('1');
    expect(
      declaration(topbarSource, '.brandContent:has(> .brandTitle)', 'min-inline-size', {
        within: NARROW,
      }),
    ).toBe('6ch');
  });

  it('ne change rien au-delà : la rangée reste sur une ligne', () => {
    expect(declaration(topbarSource, '.topbar', 'flex-wrap')).toBeUndefined();
    expect(declaration(topbarSource, '.actions', 'flex-grow')).toBeUndefined();
  });
});

describe('la carte étroite', () => {
  it('pose l’invite et les commandes sur le dessin au-delà de 30 rem', () => {
    expect(declaration(opaleSource, '.opale-svg-map__overlay', 'position')).toBe('absolute');
    expect(declaration(opaleSource, '.opale-svg-map__controls', 'position')).toBe('absolute');
  });

  it('les passe sous le dessin en deçà, sans toucher au cadre', () => {
    expect(
      declaration(opaleSource, '.opale-svg-map__overlay', 'position', { within: NARROW }),
    ).toBe('static');
    expect(
      declaration(opaleSource, '.opale-svg-map__controls', 'position', { within: NARROW }),
    ).toBe('static');
    expect(
      declaration(opaleSource, '.opale-svg-map__controls', 'flex-direction', { within: NARROW }),
    ).toBe('row');
    /* Le cadre coïncide avec le `<svg>` : l'infobulle s'y place en
       pourcentages. Il prend une ligne entière, jamais de hauteur imposée. */
    expect(declaration(opaleSource, '.opale-svg-map__canvas', 'flex', { within: NARROW })).toBe(
      '1 0 100%',
    );
    expect(
      declaration(opaleSource, '.opale-svg-map__canvas', 'block-size', { within: NARROW }),
    ).toBeUndefined();
  });
});

describe('ni la barre ni la carte ne sont des conteneurs', () => {
  const containerDecl = /(^|;|\s)container(-type|-name)?\s*:/;

  it.each([
    ['Topbar.module.css', topbarSource, ''],
    ['opale.css', opaleSource, '.opale-svg-map'],
  ])('%s', (_name, source, prefix) => {
    const offenders = parseRules(source)
      .filter((rule) => rule.selectors.some((selector) => selector.startsWith(prefix)))
      .filter((rule) => containerDecl.test(rule.body))
      .map((rule) => rule.prelude);
    expect(offenders).toEqual([]);
  });
});
