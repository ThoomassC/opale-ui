import { describe, expect, it } from 'vitest';

import { capOf, globePaths, graticule, hiddenCap } from './globe-paths';
import { absolutePoints, FILE } from '../../../test/world-map-paths';
import { createRotation } from './projection';

describe('globePaths', () => {
  const frame = { cx: 500, cy: 300, radius: 200 };

  it('projette sur le disque et laisse la face cachée', () => {
    const facing = globePaths(FILE, { rotate: createRotation(2.5, 46.5), webZoom: 3, ...frame });
    expect(facing.countries.map((country) => country.id)).toEqual(['FR', 'XX']);
    for (const ring of absolutePoints(facing.countries[0].d)) {
      for (const [x, y] of ring) expect(Math.hypot(x - 500, y - 300)).toBeLessThanOrEqual(200.1);
    }
    const hidden = globePaths(FILE, {
      rotate: createRotation(-177.5, -46.5),
      webZoom: 3,
      ...frame,
    });
    expect(hidden.countries).toEqual([]);
    expect(hidden.coast).toBe('');
  });

  it('centre la vue sur le centre du disque', () => {
    const paths = globePaths(FILE, { rotate: createRotation(2, 46), webZoom: 3, ...frame });
    const [[first]] = absolutePoints(paths.countries[0].d);
    expect(first[0]).toBeCloseTo(500, 0);
    expect(first[1]).toBeCloseTo(300, 0);
  });

  it('filtre les fleuves par min_zoom', () => {
    const paths = globePaths(FILE, { rotate: createRotation(2, 46), webZoom: 2, ...frame });
    expect(absolutePoints(paths.rivers)).toHaveLength(1);
  });
});

describe('capOf / hiddenCap', () => {
  /* Un carré de 10° autour de (5° E, 45° N). */
  const square = new Float64Array([0, 40, 10, 40, 10, 50, 0, 50]);
  const cap = capOf(square);

  it('borne l’anneau par une calotte : son centre et son rayon angulaire', () => {
    expect(cap.radius).toBeGreaterThan(0);
    expect(cap.radius).toBeLessThan(0.15);
  });

  it('cache la calotte entièrement derrière l’horizon, pas celle qui le chevauche', () => {
    expect(hiddenCap(cap, createRotation(5, 45))).toBe(false);
    expect(hiddenCap(cap, createRotation(-175, -45))).toBe(true);
    /* Le centre de la vue à 92° du carré : son bord ouest passe encore l’horizon. */
    expect(hiddenCap(cap, createRotation(97, 0))).toBe(false);
  });

  it('ne retire rien de visible : mêmes tracés, avec ou sans le test', () => {
    const rotate = createRotation(60, 10);
    const paths = globePaths(FILE, { rotate, webZoom: 3, cx: 0, cy: 0, radius: 100 });
    expect(paths.countries.map(({ id }) => id)).toEqual(['FR', 'XX']);
  });
});

describe('graticule', () => {
  const frame = { cx: 500, cy: 300, radius: 200 };

  it('trace méridiens et parallèles sur la face visible seulement', () => {
    const d = graticule(30, { rotate: createRotation(0, 20), ...frame });
    const lines = absolutePoints(d);
    expect(lines.length).toBeGreaterThan(6);
    for (const line of lines) {
      for (const [x, y] of line) expect(Math.hypot(x - 500, y - 300)).toBeLessThanOrEqual(200.1);
    }
  });

  it('se resserre à 10°', () => {
    const rotate = createRotation(0, 20);
    expect(absolutePoints(graticule(10, { rotate, ...frame })).length).toBeGreaterThan(
      absolutePoints(graticule(30, { rotate, ...frame })).length,
    );
  });
});
