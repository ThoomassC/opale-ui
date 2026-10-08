import { describe, expect, it } from 'vitest';

import {
  createRotation,
  inverseMercator,
  inverseOrthographic,
  MAX_LATITUDE,
  mercator,
  normalizeLongitude,
  orthographic,
} from './projection';

const close = (actual: number, expected: number, digits = 9) =>
  expect(actual).toBeCloseTo(expected, digits);

describe('Mercator unitaire', () => {
  it('pose le monde dans le carré unité, nord en haut', () => {
    expect(mercator(-180, MAX_LATITUDE)).toEqual([0, expect.closeTo(0, 9)]);
    const [x, y] = mercator(0, 0);
    close(x, 0.5);
    close(y, 0.5);
    const [east, south] = mercator(180, -MAX_LATITUDE);
    close(east, 1);
    close(south, 1);
  });

  it('borne la latitude à ±85,0511°', () => {
    expect(mercator(0, 89)).toEqual(mercator(0, MAX_LATITUDE));
    expect(mercator(0, -90)).toEqual(mercator(0, -MAX_LATITUDE));
  });

  it('s’inverse', () => {
    for (const [lon, lat] of [
      [2.35, 48.85],
      [-74, 40.7],
      [151.2, -33.9],
      [0, 0],
    ]) {
      const [x, y] = mercator(lon, lat);
      const [lon2, lat2] = inverseMercator(x, y);
      close(lon2, lon);
      close(lat2, lat);
    }
  });
});

describe('orthographique', () => {
  it('pose le centre de la vue au centre du disque', () => {
    const [x, y, z] = orthographic(2, 48, [2, 48]);
    close(x, 0);
    close(y, 0);
    close(z, 1);
  });

  it('met l’est à droite et le nord en haut (y vers le bas)', () => {
    const [x] = orthographic(10, 0, [0, 0]);
    expect(x).toBeGreaterThan(0);
    const [, y] = orthographic(0, 10, [0, 0]);
    expect(y).toBeLessThan(0);
  });

  it('dit la face cachée par cos c < 0', () => {
    expect(orthographic(180, 0, [0, 0])[2]).toBeLessThan(0);
    close(orthographic(90, 0, [0, 0])[2], 0);
    expect(orthographic(89, 0, [0, 0])[2]).toBeGreaterThan(0);
  });

  it('s’inverse sur le disque, et rend null au-dehors', () => {
    const center = [-30, 25] as const;
    for (const [lon, lat] of [
      [-10, 40],
      [-60, -10],
      [-30, 25],
      [20, 60],
    ]) {
      const [x, y, z] = orthographic(lon, lat, center);
      expect(z).toBeGreaterThanOrEqual(0);
      const back = inverseOrthographic(x, y, center);
      expect(back).not.toBeNull();
      close(back?.[0] ?? NaN, lon);
      close(back?.[1] ?? NaN, lat);
    }
    expect(inverseOrthographic(0.8, 0.8, center)).toBeNull();
  });

  it('tourne d’un même calcul qu’une rotation précalculée', () => {
    const rotate = createRotation(12, -34);
    const [x, y, z] = rotate(40, 10);
    const [ox, oy, oz] = orthographic(40, 10, [12, -34]);
    close(x, ox);
    close(y, oy);
    close(z, oz);
  });
});

describe('normalizeLongitude', () => {
  it('ramène dans [−180, 180)', () => {
    expect(normalizeLongitude(190)).toBe(-170);
    expect(normalizeLongitude(-190)).toBe(170);
    expect(normalizeLongitude(180)).toBe(-180);
    expect(normalizeLongitude(540)).toBe(-180);
    expect(normalizeLongitude(12.5)).toBe(12.5);
  });
});
