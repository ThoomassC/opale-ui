import { describe, expect, it } from 'vitest';

import { declaration, parseRules } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   LA PASTILLE DU SEGMENTÉ GLISSE SANS RELANCER LA MISE EN PAGE.

   Seul `transform` est animé : la largeur et la hauteur sont posées d'un coup,
   à la mesure. Transitionner `width` / `height` relançait la mise en page à
   chaque image ; un `scale` déformait le rayon de la pilule.
   ========================================================================== */

const INDICATOR = '.opale-segmented__indicator';
const ANIMATED = ".opale-segmented__indicator[data-animated='true']";
const MOTION_PROPERTIES = ['transition', 'transition-property', 'will-change'] as const;

const indicatorRules = parseRules(opaleSource).filter((rule) =>
  rule.selectors.some((selector) => selector.includes(INDICATOR)),
);

describe('SegmentedControl — mouvement de la pastille', () => {
  it('devrait trouver les règles de la pastille', () => {
    expect(indicatorRules.length).toBeGreaterThan(0);
  });

  it('ne devrait transitionner ni width ni height, dans aucune règle', () => {
    for (const rule of indicatorRules) {
      for (const property of MOTION_PROPERTIES) {
        const value = declaration(opaleSource, rule.selectors[0], property, {
          within: rule.context,
        });
        if (value === undefined) continue;
        expect(value, `${rule.prelude} { ${property} }`).not.toMatch(/\b(width|height)\b/);
      }
    }
  });

  it('devrait animer transform une fois armée', () => {
    expect(declaration(opaleSource, ANIMATED, 'transition')).toMatch(/^transform\b/);
    expect(declaration(opaleSource, INDICATOR, 'will-change')).toBe('transform');
  });

  it('devrait garder le rayon de la pilule, sans scale', () => {
    expect(declaration(opaleSource, INDICATOR, 'border-radius')).toBe('var(--opale-radius-pill)');
    for (const rule of indicatorRules) {
      expect(rule.body, rule.prelude).not.toMatch(/\bscale/);
    }
  });

  it('devrait couper le glissement sous prefers-reduced-motion', () => {
    expect(
      declaration(opaleSource, ANIMATED, 'transition', {
        within: '@media (prefers-reduced-motion: reduce)',
      }),
    ).toBe('none');
  });
});
