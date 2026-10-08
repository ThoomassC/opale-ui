import { describe, expect, it } from 'vitest';

import { declaration } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   LE CURSEUR SANS VERRE EST DESSINÉ PAR OPALE, PAS PAR LE NAVIGATEUR.

   Il n'était qu'un `<input type="range">` natif teinté par `accent-color` :
   chaque navigateur le peignait à sa façon. Retour du propriétaire (08/10) :
   correct dans Arc, mais une piste grise et une poignée carrée dans Chrome.
   La piste, la part remplie et la poignée sont désormais celles d'Opale, dans
   les moteurs WebKit/Blink comme dans Gecko ; en contrastes forcés, le natif
   revient, parce que le système sait le peindre dans ses couleurs.
   ========================================================================== */

const RANGE = '.opale-range-shell > .opale-range';

describe('le curseur sans verre', () => {
  it('retire l’apparence native', () => {
    expect(declaration(opaleSource, RANGE, 'appearance')).toBe('none');
    expect(declaration(opaleSource, RANGE, '-webkit-appearance')).toBe('none');
  });

  it('dessine la piste et la part remplie depuis la progression', () => {
    const track = declaration(opaleSource, `${RANGE}::-webkit-slider-runnable-track`, 'background');
    expect(track).toContain('var(--opale-primary)');
    expect(track).toContain('--opale-range-progress');
    expect(declaration(opaleSource, `${RANGE}::-moz-range-progress`, 'background')).toBe(
      'var(--opale-primary)',
    );
  });

  it('dessine une poignée ronde dans les deux moteurs', () => {
    for (const thumb of ['::-webkit-slider-thumb', '::-moz-range-thumb']) {
      expect(declaration(opaleSource, `${RANGE}${thumb}`, 'border-radius'), thumb).toBe('50%');
    }
    expect(declaration(opaleSource, `${RANGE}::-webkit-slider-thumb`, 'appearance')).toBe('none');
  });

  it('porte le focus clavier sur la poignée', () => {
    expect(declaration(opaleSource, `${RANGE}:focus-visible`, 'outline')).toBe('none');
    expect(
      declaration(opaleSource, `${RANGE}:focus-visible::-webkit-slider-thumb`, 'box-shadow'),
    ).toContain('var(--opale-focus)');
    expect(
      declaration(opaleSource, `${RANGE}:focus-visible::-moz-range-thumb`, 'box-shadow'),
    ).toContain('var(--opale-focus)');
  });

  it('rend la main au natif en contrastes forcés', () => {
    expect(
      declaration(opaleSource, RANGE, 'appearance', { within: ['@media (forced-colors: active)'] }),
    ).toBe('auto');
  });
});
