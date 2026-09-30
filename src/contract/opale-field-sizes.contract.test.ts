import { describe, expect, it } from 'vitest';

import { declarations } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   LA TAILLE DES CHAMPS, DE LA CASE, DE L'INTERRUPTEUR ET DU SEGMENTÉ (DX-11).

   `small` et `large` s'ajoutent par classes ; `medium` n'en a pas et doit
   rester au pixel près ce qu'il était. Le garde le plus utile est celui de
   l'interrupteur : sa course est une soustraction — piste − poignée − deux
   marges — et une taille dont la translation ne suit pas sort la poignée de
   sa piste, en gauche à droite comme en droite à gauche.
   ========================================================================== */

const rule = (selector: string) => declarations(opaleSource, selector);
const rem = (value: string | undefined): number => {
  const match = /^(-?\d*\.?\d+)rem$/.exec(value ?? '');
  if (!match) throw new Error(`longueur en rem attendue, reçu « ${value} »`);
  return Number(match[1]);
};

describe('le rendu medium ne bouge pas', () => {
  it('garde la coquille du champ sur --opale-control-md', () => {
    expect(rule('.opale-input-shell').get('min-height')).toBe('var(--opale-control-md)');
  });

  it('garde la case à 1,25 rem', () => {
    expect(rule('.opale-checkbox-mark').get('width')).toBe('1.25rem');
    expect(rule('.opale-checkbox-mark').get('height')).toBe('1.25rem');
  });

  it('garde l’interrupteur à 3,25 × 1,75 rem, poignée de 1,25 rem', () => {
    expect(rule('.opale-toggle-track').get('width')).toBe('3.25rem');
    expect(rule('.opale-toggle-track').get('height')).toBe('1.75rem');
    expect(rule('.opale-toggle-thumb').get('width')).toBe('1.25rem');
    expect(rule('.opale-toggle-thumb').get('margin-inline-start')).toBe('0.25rem');
  });
});

describe('les champs small et large', () => {
  it.each([
    ['small', 'sm'],
    ['large', 'lg'],
  ])('alignent la coquille %s sur --opale-control-%s', (size, step) => {
    expect(rule(`.opale-field--${size} .opale-input-shell`).get('min-height')).toBe(
      `var(--opale-control-${step})`,
    );
  });

  it.each([
    ['small', 'sm'],
    ['large', 'lg'],
  ])('prennent la taille de texte %s sur l’échelle', (size, step) => {
    for (const control of ['.opale-input', '.opale-select']) {
      expect(rule(`.opale-field--${size} ${control}`).get('font-size')).toBe(
        `var(--opale-text-${step})`,
      );
    }
  });
});

describe('la course de la poignée', () => {
  const base = {
    track: rem(rule('.opale-toggle-track').get('width')),
    trackHeight: rem(rule('.opale-toggle-track').get('height')),
    thumb: rem(rule('.opale-toggle-thumb').get('width')),
    margin: rem(rule('.opale-toggle-thumb').get('margin-inline-start')),
  };

  function geometry(size: 'small' | 'large') {
    const track = rule(`.opale-toggle-row--${size} .opale-toggle-track`);
    const thumb = rule(`.opale-toggle-row--${size} .opale-toggle-thumb`);
    return {
      track: rem(track.get('width')),
      trackHeight: rem(track.get('height')),
      thumb: rem(thumb.get('width')),
      margin: thumb.has('margin-inline-start')
        ? rem(thumb.get('margin-inline-start'))
        : base.margin,
    };
  }

  it('vaut piste − poignée − deux marges en medium', () => {
    expect(
      rule('.opale-toggle:checked + .opale-toggle-track .opale-toggle-thumb').get('transform'),
    ).toBe(
      `translateX(calc(${base.track - base.thumb - 2 * base.margin}rem * var(--opale-inline-direction, 1)))`,
    );
  });

  it.each(['small', 'large'] as const)('suit la géométrie en %s, pleine et sous verre', (size) => {
    const { track, trackHeight, thumb, margin } = geometry(size);
    const travel = track - thumb - 2 * margin;

    /* La poignée est centrée : la marge d'extrémité vaut la marge verticale. */
    expect(margin).toBeCloseTo((trackHeight - thumb) / 2, 5);
    for (const sibling of ['+ .opale-toggle-track', '+ * .opale-toggle-track']) {
      expect(
        rule(`.opale-toggle-row--${size} .opale-toggle:checked ${sibling} .opale-toggle-thumb`).get(
          'transform',
        ),
      ).toBe(`translateX(calc(${travel}rem * var(--opale-inline-direction, 1)))`);
    }
  });

  it('retourne la course de droite à gauche par la poignée', () => {
    expect(rule('.opale-toggle-thumb:dir(rtl)').get('--opale-inline-direction')).toBe('-1');
  });
});

describe('les options désactivées', () => {
  it.each([".opale-multiselect__option[aria-disabled='true']", '.opale-segmented__item:disabled'])(
    '%s s’efface de l’opacité commune',
    (selector) => {
      const declared = rule(selector);
      expect(declared.get('opacity')).toBe('var(--opale-disabled-opacity)');
      expect(declared.get('cursor')).toBe('not-allowed');
    },
  );
});

describe('le segmenté small et large', () => {
  it.each([
    ['small', 'xs'],
    ['large', 'md'],
  ])('%s prend la taille de texte --opale-text-%s', (size, step) => {
    expect(rule(`.opale-segmented--${size} .opale-segmented__item`).get('font-size')).toBe(
      `var(--opale-text-${step})`,
    );
  });
});
