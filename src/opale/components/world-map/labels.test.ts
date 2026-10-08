import { describe, expect, it } from 'vitest';

import {
  labelBox,
  MAX_CITY_LABELS,
  MAX_COUNTRY_LABELS,
  placeLabels,
  type CityCandidate,
  type CountryCandidate,
  type PlacedLabel,
} from './labels';

const OPTIONS = { width: 1000, height: 600, countryFontSize: 14, cityFontSize: 11 };

const overlaps = (a: PlacedLabel, b: PlacedLabel) =>
  a.box.left < b.box.right &&
  b.box.left < a.box.right &&
  a.box.top < b.box.bottom &&
  b.box.top < a.box.bottom;

const city = (
  id: string,
  x: number,
  y: number,
  population: number,
  capital = false,
): CityCandidate => ({
  id,
  text: id,
  x,
  y,
  population,
  capital,
});

describe('labelBox', () => {
  it('mesure chars × 0,55 em de large, une hauteur de police de haut', () => {
    expect(labelBox('Paris', 100, 50, 10, 'center')).toEqual({
      left: 100 - 13.75,
      right: 100 + 13.75,
      top: 45,
      bottom: 55,
    });
    expect(labelBox('Lyon', 100, 50, 10, 'start').left).toBeGreaterThan(100);
  });
});

describe('placeLabels', () => {
  it('ne pose jamais deux étiquettes l’une sur l’autre', () => {
    const cities = Array.from({ length: 200 }, (_, i) =>
      city(`Ville ${i}`, 20 + ((i * 37) % 960), 20 + ((i * 53) % 560), 1000 - i),
    );
    const placed = placeLabels([], cities, OPTIONS);
    for (const [i, a] of placed.entries()) {
      for (const b of placed.slice(i + 1)) expect(overlaps(a, b), `${a.id} / ${b.id}`).toBe(false);
    }
  });

  it('pose les capitales avant les villes plus peuplées, puis par population', () => {
    const placed = placeLabels(
      [],
      [
        city('Grande', 100, 100, 9_000_000),
        city('Capitale', 104, 101, 200_000, true),
        city('Moyenne', 103, 99, 5_000_000),
      ],
      OPTIONS,
    );
    expect(placed.map((label) => label.id)).toEqual(['Capitale']);
    const apart = placeLabels(
      [],
      [city('Petite', 100, 100, 10), city('Grande', 100, 300, 9_000_000)],
      OPTIONS,
    );
    expect(apart.map((label) => label.id)).toEqual(['Grande', 'Petite']);
  });

  it('pose les pays d’abord, par importance (min_label)', () => {
    const countries: CountryCandidate[] = [
      { id: 'LU', text: 'Luxembourg', x: 500, y: 300, minLabel: 5 },
      { id: 'FR', text: 'France', x: 505, y: 302, minLabel: 1.7 },
    ];
    const placed = placeLabels(countries, [city('Metz', 500, 300, 100_000)], OPTIONS);
    expect(placed.map((label) => label.id)).toEqual(['FR']);
    expect(placed[0].kind).toBe('country');
  });

  it(`borne à ${MAX_CITY_LABELS} villes et ${MAX_COUNTRY_LABELS} pays`, () => {
    const cities = Array.from({ length: 500 }, (_, i) =>
      city(`c${i}`, (i % 50) * 200, Math.floor(i / 50) * 100, i),
    );
    const countries = Array.from({ length: 100 }, (_, i) => ({
      id: `p${i}`,
      text: 'P',
      x: (i % 10) * 1000 + 50000,
      y: Math.floor(i / 10) * 100,
      minLabel: 1,
    }));
    const placed = placeLabels(countries, cities, { ...OPTIONS, width: 100_000, height: 100_000 });
    expect(placed.filter((label) => label.kind === 'city')).toHaveLength(MAX_CITY_LABELS);
    expect(placed.filter((label) => label.kind === 'country')).toHaveLength(MAX_COUNTRY_LABELS);
  });

  it('laisse ce qui déborde du cadre', () => {
    expect(placeLabels([], [city('Bord', 995, 300, 1)], OPTIONS)).toEqual([]);
  });

  it('rend le même résultat quel que soit l’ordre des candidats', () => {
    const cities = Array.from({ length: 80 }, (_, i) =>
      city(`v${i}`, (i * 71) % 1000, (i * 29) % 600, i % 7),
    );
    const a = placeLabels([], cities, OPTIONS);
    const b = placeLabels([], [...cities].reverse(), OPTIONS);
    expect(b).toEqual(a);
  });

  it('laisse la place aux obstacles — les repères posés sur la carte', () => {
    const paris = city('Paris', 500, 300, 2_000_000);
    expect(placeLabels([], [paris], OPTIONS)).toHaveLength(1);
    const pin = { left: 510, right: 530, top: 290, bottom: 310 };
    expect(placeLabels([], [paris], { ...OPTIONS, obstacles: [pin] })).toEqual([]);
  });
});
