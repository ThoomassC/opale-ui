import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { OUTPUT_DIR, quantize } from '../../../../scripts/world-data.mjs';
import {
  decodeRing,
  parseWorldDataFile,
  parseWorldDataIndex,
  WorldDataError,
  type WorldDataFile,
} from './data-format';

const FILE: WorldDataFile = {
  v: 1,
  q: [-180, -90, 0.01],
  bbox: [-180, -90, 180, 90],
  countries: [{ id: 'FR', r: [[[18000, 9000, 100, 0, 0, 100]]] }],
  coast: [[18000, 9000, 5, 5]],
  borders: [],
  rivers: [{ mz: 2.1, l: [18000, 9000, 1, 1] }],
  places: [{ n: 'Paris', lon: 2.35, lat: 48.86, pop: 9_904_000, mz: 1.7, cap: 1 }],
  countryLabels: [{ id: 'FR', lon: 2.5, lat: 46.5, min: 1.7, max: 6.7 }],
};

const INDEX = {
  version: 1,
  source: { name: 'Natural Earth', version: '5.1.2' },
  lods: {
    '110m': { file: '110m.json' },
    '50m': { file: '50m.json' },
    '10m': { tileDegrees: 10, tiles: ['18_4', '19_4'] },
  },
};

describe('decodeRing', () => {
  it('additionne les deltas et rend des degrés à plat', () => {
    const decoded = decodeRing([18000, 9000, 100, 0, 0, 100], [-180, -90, 0.01]);
    expect(decoded).toBeInstanceOf(Float64Array);
    expect([...decoded].map((value) => Math.round(value * 1e9) / 1e9)).toEqual([0, 0, 1, 0, 1, 1]);
  });

  it('relit ce que le script a quantifié', () => {
    const q = [0, 40, 0.001] as const;
    const encoded = quantize(
      [
        [2.3522, 48.8566],
        [2.4, 48.9],
      ],
      q,
      false,
    );
    const decoded = decodeRing(encoded ?? [], q);
    expect(decoded[0]).toBeCloseTo(2.352, 9);
    expect(decoded[3]).toBeCloseTo(48.9, 9);
  });
});

describe('parseWorldDataFile', () => {
  it('accepte un fichier conforme et le rend tel quel', () => {
    expect(parseWorldDataFile(structuredClone(FILE))).toEqual(FILE);
  });

  it.each([
    ['une version inconnue', { ...FILE, v: 2 }],
    ['une quantification incomplète', { ...FILE, q: [0, 0] }],
    ['un pas nul', { ...FILE, q: [0, 0, 0] }],
    ['un pays sans identifiant', { ...FILE, countries: [{ r: [] }] }],
    ['une ligne de longueur impaire', { ...FILE, coast: [[1, 2, 3]] }],
    ['une ligne d’un seul point', { ...FILE, coast: [[1, 2]] }],
    ['un nombre qui n’en est pas un', { ...FILE, borders: [[1, 2, 'x', 4]] }],
    ['un fleuve sans min_zoom', { ...FILE, rivers: [{ l: [1, 2, 3, 4] }] }],
    ['une ville sans nom', { ...FILE, places: [{ lon: 0, lat: 0, pop: 1, mz: 1 }] }],
    ['autre chose qu’un objet', 'oops'],
    ['null', null],
  ])('refuse %s par une WorldDataError', (_, json) => {
    expect(() => parseWorldDataFile(json)).toThrow(WorldDataError);
  });

  it('relit les fichiers écrits par le script', () => {
    for (const name of ['110m.json', '50m.json', '10m/18_4.json']) {
      const json: unknown = JSON.parse(readFileSync(join(OUTPUT_DIR, name), 'utf8'));
      expect(() => parseWorldDataFile(json), name).not.toThrow();
    }
  });
});

describe('parseWorldDataIndex', () => {
  it('accepte un index conforme', () => {
    expect(parseWorldDataIndex(structuredClone(INDEX))).toEqual(INDEX);
  });

  it('relit l’index écrit par le script', () => {
    const json: unknown = JSON.parse(readFileSync(join(OUTPUT_DIR, 'index.json'), 'utf8'));
    expect(parseWorldDataIndex(json).lods['10m'].tiles.length).toBeGreaterThan(100);
  });

  it.each([
    ['une version inconnue', { ...INDEX, version: 2 }],
    ['une autre source', { ...INDEX, source: { name: 'OSM', version: '1' } }],
    [
      'une grille de 5°',
      { ...INDEX, lods: { ...INDEX.lods, '10m': { tileDegrees: 5, tiles: [] } } },
    ],
    [
      'une clé de tuile malformée',
      { ...INDEX, lods: { ...INDEX.lods, '10m': { tileDegrees: 10, tiles: ['../x'] } } },
    ],
    [
      'un fichier hors du dossier',
      { ...INDEX, lods: { ...INDEX.lods, '110m': { file: '../110m.json' } } },
    ],
    ['un tableau', []],
  ])('refuse %s', (_, json) => {
    expect(() => parseWorldDataIndex(json)).toThrow(WorldDataError);
  });

  it('dit ce qui ne va pas, sans exposer le contenu', () => {
    expect(() => parseWorldDataIndex({})).toThrow(/index/i);
  });
});
