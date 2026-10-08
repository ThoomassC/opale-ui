import { describe, expect, it } from 'vitest';

import type { WorldDataFile } from './data-format';
import { flatPaths, formatFixed, globePaths } from './path-builder';
import { createRotation } from './projection';
import { worldPoint } from './view';

/** Les points absolus d'un tracé `M … l … z`. */
function absolutePoints(d: string): [number, number][][] {
  const rings: [number, number][][] = [];
  let x = 0;
  let y = 0;
  for (const [, command, body] of d.matchAll(/([Mlz])([^Mlz]*)/g)) {
    if (command === 'z') continue;
    const numbers = (body.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      if (command === 'M' && i === 0) {
        x = numbers[0];
        y = numbers[1];
        rings.push([[x, y]]);
      } else {
        x += numbers[i];
        y += numbers[i + 1];
        rings[rings.length - 1].push([x, y]);
      }
    }
  }
  return rings;
}

/* Un carré de 1° autour de (2°E, 46°N), un lac, une côte, deux fleuves. */
const FILE: WorldDataFile = {
  v: 1,
  q: [0, 40, 0.01],
  bbox: [0, 40, 10, 50],
  countries: [
    { id: 'FR', r: [[[200, 600, 100, 0, 0, 100, -100, 0]]] },
    { id: 'XX', r: [[[700, 900, 10, 0, 0, 10]]] },
  ],
  lakes: [[[250, 650, 10, 0, 0, 10]]],
  coast: [[200, 600, 50, 50, 50, -50]],
  borders: [[300, 600, 0, 100]],
  rivers: [
    { mz: 5, l: [210, 610, 10, 10] },
    { mz: 2, l: [220, 620, 10, 10] },
  ],
};

describe('formatFixed', () => {
  it('écrit un entier à virgule fixe au plus court', () => {
    expect(formatFixed(1234, 2)).toBe('12.34');
    expect(formatFixed(-50, 2)).toBe('-.5');
    expect(formatFixed(7, 3)).toBe('.007');
    expect(formatFixed(3000, 3)).toBe('3');
    expect(formatFixed(0, 2)).toBe('0');
  });
});

describe('flatPaths', () => {
  it('écrit un M absolu puis des l relatifs, en unités du monde (0…1000)', () => {
    const { countries } = flatPaths(FILE);
    const france = countries.find((country) => country.id === 'FR');
    expect(france?.d).toMatch(/^M[^Ml]+l[^M]+z$/);
    const [ring] = absolutePoints(france?.d ?? '');
    const expected = [
      [2, 46],
      [3, 46],
      [3, 47],
      [2, 47],
    ].map(([lon, lat]) => worldPoint(lon, lat));
    expect(ring).toHaveLength(4);
    ring.forEach(([x, y], index) => {
      expect(x).toBeCloseTo(expected[index][0], 1);
      expect(y).toBeCloseTo(expected[index][1], 1);
    });
  });

  it('rend un tracé par pays et un seul par couche de lignes', () => {
    const paths = flatPaths(FILE);
    expect(paths.countries.map((country) => country.id)).toEqual(['FR', 'XX']);
    expect(typeof paths.coast).toBe('string');
    expect(absolutePoints(paths.coast)).toHaveLength(1);
    expect(absolutePoints(paths.borders)).toHaveLength(1);
    expect(absolutePoints(paths.lakes)).toHaveLength(1);
  });

  it('garde en cache le travail d’un même fichier', () => {
    expect(flatPaths(FILE)).toBe(flatPaths(FILE));
    expect(flatPaths(FILE).rivers(3)).toBe(flatPaths(FILE).rivers(3));
  });

  it('filtre fleuves et limites par min_zoom', () => {
    const paths = flatPaths(FILE);
    expect(paths.rivers(1)).toBe('');
    expect(absolutePoints(paths.rivers(2))).toHaveLength(1);
    expect(absolutePoints(paths.rivers(5))).toHaveLength(2);
    expect(paths.admin1(9)).toBe('');
  });

  it('affine la précision au pas de quantification des tuiles 10m', () => {
    const fine = flatPaths({ ...FILE, q: [0, 40, 0.001] });
    expect(fine.borders).toMatch(/\.\d{3}/);
  });
});

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
