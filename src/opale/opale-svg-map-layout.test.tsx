import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SvgMap, type SvgMapRegion } from './opale';

afterEach(cleanup);

const REGIONS: readonly SvgMapRegion[] = [
  { id: 'a', path: 'M0 0 H100 V100 H0 Z', name: 'Alpha' },
  { id: 'b', path: 'M100 0 H200 V100 H100 Z', name: 'Bêta' },
];

/* LE CADRE COÏNCIDE AVEC LE DESSIN. L'infobulle s'y place en pourcentages de
   sa boîte : si l'invite ou les commandes y vivaient, elles l'allongeraient
   dès qu'elles passent sous le dessin (écran étroit), et l'infobulle d'une
   région atteinte au clavier tomberait à côté. Elles sont donc ses sœurs. */
describe('SvgMap — la disposition de l’invite et des commandes', () => {
  it('rend l’invite et les commandes hors du cadre, après lui', () => {
    const { container } = render(
      <SvgMap viewBox="0 0 200 100" regions={REGIONS} overlay={<p>Consigne</p>} />,
    );

    const frame = container.querySelector('.opale-svg-map__frame');
    const canvas = container.querySelector('.opale-svg-map__canvas');
    const overlay = container.querySelector('.opale-svg-map__overlay');
    const controls = container.querySelector('.opale-svg-map__controls');

    expect(frame).not.toBeNull();
    expect([...(frame?.children ?? [])]).toEqual([canvas, overlay, controls]);
    expect(canvas?.contains(overlay ?? null)).toBe(false);
    expect(canvas?.contains(controls ?? null)).toBe(false);
    expect(canvas?.querySelector('svg')).not.toBeNull();
  });

  it('garde l’ordre de tabulation : régions, invite, commandes', () => {
    const { container } = render(
      <SvgMap
        viewBox="0 0 200 100"
        regions={REGIONS}
        selectable
        overlay={<button type="button">Aide</button>}
      />,
    );

    const tabbable = [
      ...container.querySelectorAll<HTMLElement | SVGElement>('[tabindex="0"], button'),
    ].map((node) => node.getAttribute('aria-label') ?? node.textContent);
    expect(tabbable.slice(0, 2)).toEqual(['Alpha', 'Aide']);
    expect(tabbable.slice(2)).toEqual(['Zoomer', 'Dézoomer', 'Vue d’ensemble']);
  });
});
