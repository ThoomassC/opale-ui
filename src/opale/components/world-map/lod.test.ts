import { describe, expect, it } from 'vitest';

import { tileKey as scriptTileKey, tilesCovering } from '../../../../scripts/world-data.mjs';
import {
  byMinZoom,
  flatBounds,
  MAX_RASTER_TILES,
  MAX_VECTOR_TILES,
  rasterTiles,
  selectLod,
  tileKey,
  visibleTiles,
} from './lod';
import { frameOf } from './view';

const frame = frameOf(16 / 9);

describe('selectLod — plan', () => {
  it('suit le zoom web : 110m sous 2,5, 50m sous 4, 10m au-delà', () => {
    expect(selectLod({ mode: 'flat', webZoom: 1 })).toBe('110m');
    expect(selectLod({ mode: 'flat', webZoom: 2.5 })).toBe('50m');
    expect(selectLod({ mode: 'flat', webZoom: 3.9 })).toBe('50m');
    expect(selectLod({ mode: 'flat', webZoom: 4 })).toBe('10m');
  });

  it('ne bascule qu’au-delà de ±0,25 du seuil, depuis le niveau précédent', () => {
    expect(selectLod({ mode: 'flat', webZoom: 2.6, previous: '110m' })).toBe('110m');
    expect(selectLod({ mode: 'flat', webZoom: 2.8, previous: '110m' })).toBe('50m');
    expect(selectLod({ mode: 'flat', webZoom: 2.4, previous: '50m' })).toBe('50m');
    expect(selectLod({ mode: 'flat', webZoom: 2.2, previous: '50m' })).toBe('110m');
    expect(selectLod({ mode: 'flat', webZoom: 4.1, previous: '50m' })).toBe('50m');
    expect(selectLod({ mode: 'flat', webZoom: 3.8, previous: '10m' })).toBe('10m');
    expect(selectLod({ mode: 'flat', webZoom: 3.7, previous: '10m' })).toBe('50m');
    expect(selectLod({ mode: 'flat', webZoom: 6, previous: '110m' })).toBe('10m');
  });

  it('reste en 50m quand trop de tuiles 10m seraient visibles', () => {
    expect(selectLod({ mode: 'flat', webZoom: 5, tileCount: MAX_VECTOR_TILES })).toBe('10m');
    expect(selectLod({ mode: 'flat', webZoom: 5, tileCount: null })).toBe('50m');
  });
});

describe('selectLod — globe', () => {
  it('110m pendant un geste, 50m au repos, jamais 10m', () => {
    expect(selectLod({ mode: 'globe', webZoom: 9, gesturing: true })).toBe('110m');
    expect(selectLod({ mode: 'globe', webZoom: 9 })).toBe('50m');
    expect(selectLod({ mode: 'globe', webZoom: 0, previous: '10m' })).toBe('50m');
  });
});

describe('visibleTiles', () => {
  it('suit la grille du script : colonnes depuis −180°, rangées depuis le nord', () => {
    for (const box of [
      [-1, -1, 1, 1],
      [2, 42, 8, 51],
      [-180, -90, -175, -85],
      [170, 80, 180, 90],
    ] as const) {
      expect(visibleTiles(box)).toEqual(tilesCovering(box).map(([c, r]) => scriptTileKey(c, r)));
    }
    expect(tileKey(18, 4)).toBe('18_4');
  });

  it(`rend null au-delà de ${MAX_VECTOR_TILES} tuiles`, () => {
    expect(MAX_VECTOR_TILES).toBe(16);
    expect(visibleTiles([0, 10, 40, 50])).toHaveLength(16);
    expect(visibleTiles([0, 10, 50, 50])).toBeNull();
  });
});

describe('flatBounds', () => {
  it('rend l’emprise géographique de la vue', () => {
    const [west, south, east, north] = flatBounds({ longitude: 0, latitude: 0, zoom: 0 }, frame);
    expect(west).toBeCloseTo(-180, 9);
    expect(east).toBeCloseTo(180, 9);
    expect(north).toBeCloseTo(-south, 9);
    expect(north).toBeLessThan(85);
  });
});

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

describe('byMinZoom', () => {
  it('garde ce qui paraît au zoom web courant', () => {
    const items = [{ mz: 1 }, { mz: 3.5 }, { mz: 6 }];
    expect(byMinZoom(items, 3.5)).toEqual([{ mz: 1 }, { mz: 3.5 }]);
  });
});
