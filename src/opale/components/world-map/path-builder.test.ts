import { describe, expect, it } from 'vitest';

import { absolutePoints, FILE } from '../../../test/world-map-paths';
import { flatPaths, formatFixed } from './path-builder';
import { worldPoint } from './view';

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
