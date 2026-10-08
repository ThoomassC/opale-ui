import { describe, expect, it } from 'vitest';

import {
  diskVectors,
  equirectangular,
  frameGuard,
  MAX_RASTER_TILES,
  rasterTiles,
  sampleGlobe,
  tileUrl,
  type Texture,
} from './raster';
import { frameOf } from './view';

const frame = frameOf(16 / 9);

describe('rasterTiles', () => {
  it('prend z = round(zoom web) et couvre la vue', () => {
    const tiles = rasterTiles({ longitude: 0, latitude: 0, zoom: 0 }, frame, 1000);
    expect(new Set(tiles.map((tile) => tile.z))).toEqual(new Set([2]));
    expect(tiles).toHaveLength(16);
    expect(tiles[0]).toEqual({ z: 2, x: 0, y: 0, left: 0, top: -218.75, size: 250 });
  });

  it('sur-zoome au-delà du niveau 8 au lieu de demander des tuiles absentes', () => {
    const tiles = rasterTiles({ longitude: 2.35, latitude: 48.85, zoom: 9 }, frame, 1000);
    expect(tiles.every((tile) => tile.z === 8)).toBe(true);
    expect(tiles[0].size).toBeCloseTo(2000, 6);
  });

  it('sur-zoome dès le niveau maximal de l’appelant', () => {
    const tiles = rasterTiles({ longitude: 2.35, latitude: 48.85, zoom: 4 }, frame, 1000, 5);
    expect(tiles.every((tile) => tile.z === 5)).toBe(true);
    /* Zoom web 6 pour un niveau 5 : chaque image est agrandie deux fois. */
    expect(tiles[0].size).toBeCloseTo(500, 6);
  });

  it(`ne dépasse jamais ${MAX_RASTER_TILES} images`, () => {
    expect(MAX_RASTER_TILES).toBe(48);
    for (const px of [400, 1000, 2600, 4000]) {
      for (const zoom of [0, 1.4, 3.6, 7]) {
        const tiles = rasterTiles({ longitude: 10, latitude: 20, zoom }, frameOf(1), px);
        expect(tiles.length).toBeLessThanOrEqual(48);
        expect(tiles.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('tileUrl', () => {
  it('remplace {z}, {x} et {y}, partout où ils paraissent', () => {
    expect(tileUrl('https://t.test/{z}/{y}/{x}.jpeg?z={z}', { z: 3, x: 5, y: 2 })).toBe(
      'https://t.test/3/2/5.jpeg?z=3',
    );
  });
});

/** Une texture de `width × height` texels, le texel i peint `[i, 0, 0, 255]`. */
function numbered(width: number, height: number): Texture {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) data.set([i, 0, 0, 255], i * 4);
  return { data, width, height };
}

describe('equirectangular', () => {
  it('recompose Mercator en latitudes régulières, la calotte polaire prenant la rangée du bord', () => {
    /* Mercator d'une colonne : le nord rouge, le sud bleu. */
    const mercator: Texture = {
      data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]),
      width: 1,
      height: 2,
    };
    const out = equirectangular(mercator, 2, 64);
    expect(out.width).toBe(2);
    expect(out.height).toBe(64);
    /* La première rangée est centrée à 88,6° N, au-delà de 85,05° : rouge. */
    expect([...out.data.slice(0, 4)]).toEqual([255, 0, 0, 255]);
    /* La dernière, à 88,6° S : bleu. */
    expect([...out.data.slice(-4)]).toEqual([0, 0, 255, 255]);
    /* L'équateur sépare les deux moitiés. */
    expect(out.data[31 * 2 * 4]).toBe(255);
    expect(out.data[32 * 2 * 4 + 2]).toBe(255);
  });
});

describe('diskVectors', () => {
  it('rend x, y, z sur la sphère unité, NaN hors du disque', () => {
    const disk = diskVectors(3, 3, { x0: -1.5, y0: -1.5, x1: 1.5, y1: 1.5 }, 0, 0, 1);
    expect(disk).toBeInstanceOf(Float32Array);
    expect(disk).toHaveLength(27);
    /* Le centre fait face. */
    expect([...disk.slice(12, 15)]).toEqual([0, 0, 1]);
    /* Un coin est hors du disque. */
    expect(Number.isNaN(disk[0])).toBe(true);
  });
});

describe('sampleGlobe', () => {
  const texture = numbered(4, 2);
  const centre = diskVectors(1, 1, { x0: -1, y0: -1, x1: 1, y1: 1 }, 0, 0, 1);
  const sample = (longitude: number, latitude: number) => {
    const out = new Uint8ClampedArray(4);
    sampleGlobe(texture, centre, longitude, latitude, out);
    return [...out];
  };

  it('peint au centre du disque le texel du centre de la vue', () => {
    /* (45° E, 30° N) : quatrième de longitude [0, 90), moitié nord. */
    expect(sample(45, 30)).toEqual([2, 0, 0, 255]);
    /* (135° O, 30° S) : premier quart, moitié sud. */
    expect(sample(-135, -30)).toEqual([4, 0, 0, 255]);
    expect(sample(170, -60)).toEqual([7, 0, 0, 255]);
  });

  it('peint le pôle de la rangée du bord', () => {
    expect(sample(0, 90)[0]).toBeLessThan(4);
    expect(sample(0, -90)[0]).toBeGreaterThanOrEqual(4);
  });

  it('garde transparent un texel que la texture n’a pas (une tuile en échec)', () => {
    const holed = numbered(4, 2);
    holed.data[2 * 4 + 3] = 0;
    const out = new Uint8ClampedArray(4);
    sampleGlobe(holed, centre, 45, 30, out);
    expect(out[3]).toBe(0);
  });

  it('laisse transparent ce qui est hors du disque', () => {
    const disk = diskVectors(3, 3, { x0: -1.5, y0: -1.5, x1: 1.5, y1: 1.5 }, 0, 0, 1);
    const out = new Uint8ClampedArray(9 * 4).fill(9);
    sampleGlobe(texture, disk, 0, 0, out);
    expect(out[3]).toBe(0);
    expect(out[4 * 4 + 3]).toBe(255);
  });

  it('suit la rotation : un point à l’est du centre a une longitude plus grande', () => {
    const disk = diskVectors(2, 1, { x0: -1, y0: -0.5, x1: 1, y1: 0.5 }, 0, 0, 1);
    const out = new Uint8ClampedArray(8);
    /* Centre (90° O, 10° N) : à gauche vers 120° O, à droite vers 60° O. */
    sampleGlobe(texture, disk, -90, 10, out);
    expect(out[0]).toBe(0);
    expect(out[4]).toBe(1);
  });
});

describe('frameGuard', () => {
  it('ne cède qu’après deux images de geste lentes CONSÉCUTIVES', () => {
    const guard = frameGuard();
    guard.record(30, { moving: true });
    guard.record(5, { moving: true });
    guard.record(30, { moving: true });
    expect(guard.skip(true)).toBe(false);
    guard.record(30, { moving: true });
    expect(guard.skip(true)).toBe(true);
    /* Au repos, le globe se peint toujours. */
    expect(guard.skip(false)).toBe(false);
  });

  it('ne compte pas l’image qui suit un changement de taille de toile', () => {
    const guard = frameGuard();
    guard.record(30, { moving: true, resized: true });
    guard.record(30, { moving: true });
    expect(guard.skip(true)).toBe(false);
  });

  it('repart de zéro après une image au repos', () => {
    const guard = frameGuard();
    guard.record(30, { moving: true });
    guard.record(30, { moving: true });
    guard.record(40, { moving: false });
    expect(guard.skip(true)).toBe(false);
  });
});
