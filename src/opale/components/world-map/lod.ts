/* =============================================================================
   LES NIVEAUX DE DÉTAIL DE `WorldMap` — sans React, sans DOM.

   Trois jeux Natural Earth : 110m (le monde en un fichier léger), 50m, et
   10m découpé en tuiles de 10° × 10°. Le niveau suit le ZOOM WEB (celui des
   tuiles, voir `webZoom`), pas le zoom de la vue : une carte large en
   pixels montre plus de détail au même zoom.

   - Plan : 110m sous 2,5 ; 50m sous 4 ; 10m au-delà, tant que la vue ne
     couvre pas plus de 16 tuiles 10m. Une HYSTÉRÉSIS de ±0,25 autour de
     chaque seuil évite de recharger en boucle quand on zoome autour.
   - Globe : 110m pendant un geste (il faut redécouper à chaque image),
     50m au repos, jamais 10m.
   - Imagerie : z = round(zoom web), borné à [0, 8] ; au-delà, les tuiles du
     niveau 8 sont agrandies (sur-zoom), jamais plus de 48 images.
   ========================================================================== */

import {
  flatTransform,
  unprojectFlat,
  webZoom as toWebZoom,
  WORLD_SIZE,
  type Frame,
  type WorldMapMode,
  type WorldMapView,
} from './view';

export type Lod = '110m' | '50m' | '10m';

/** Le plus de tuiles 10m chargées pour une vue. */
export const MAX_VECTOR_TILES = 16;
/** Le plus d'images d'imagerie posées pour une vue. */
export const MAX_RASTER_TILES = 48;
/** Le niveau le plus fin de l'imagerie (NASA GIBS, `GoogleMapsCompatible_Level8`). */
export const RASTER_MAX_ZOOM = 8;

const LEVELS: readonly Lod[] = ['110m', '50m', '10m'];
const THRESHOLDS = [2.5, 4] as const;
const HYSTERESIS = 0.25;
const TILE_DEGREES = 10;

export interface LodQuery {
  readonly mode: WorldMapMode;
  readonly webZoom: number;
  /** Un geste est en cours (glisser, pincer, animation). */
  readonly gesturing?: boolean;
  /** Le niveau affiché jusqu'ici, pour l'hystérésis. */
  readonly previous?: Lod;
  /**
   * Le nombre de tuiles 10m que la vue demanderait, `null` s'il y en a trop
   * (voir `visibleTiles`). Absent : pas de limite.
   */
  readonly tileCount?: number | null;
}

/** Le niveau de détail à afficher. */
export function selectLod({
  mode,
  webZoom,
  gesturing = false,
  previous,
  tileCount,
}: LodQuery): Lod {
  if (mode === 'globe') return gesturing ? '110m' : '50m';
  /* Chaque seuil se décale de ±0,25 en s'éloignant du niveau précédent : on
     monte au-delà de seuil + 0,25, on redescend sous seuil − 0,25. */
  const from = previous ? LEVELS.indexOf(previous) : -1;
  let rank = 0;
  THRESHOLDS.forEach((threshold, index) => {
    const shifted =
      from < 0 ? threshold : index < from ? threshold - HYSTERESIS : threshold + HYSTERESIS;
    if (webZoom >= shifted) rank = index + 1;
  });
  if (rank === 2 && (tileCount === null || (tileCount ?? 0) > MAX_VECTOR_TILES)) rank = 1;
  return LEVELS[rank];
}

/** La clé d'une tuile 10m : `col_row`. */
export function tileKey(col: number, row: number): string {
  return `${col}_${row}`;
}

const clampInt = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Les tuiles 10m qu'une emprise `[ouest, sud, est, nord]` recouvre, rangée
 * par rangée depuis le nord ; `null` au-delà de `MAX_VECTOR_TILES`.
 */
export function visibleTiles([west, south, east, north]: readonly [
  number,
  number,
  number,
  number,
]): string[] | null {
  const colMin = clampInt(Math.floor((west + 180) / TILE_DEGREES), 0, 35);
  const colMax = clampInt(Math.ceil((east + 180) / TILE_DEGREES) - 1, colMin, 35);
  const rowMin = clampInt(Math.floor((90 - north) / TILE_DEGREES), 0, 17);
  const rowMax = clampInt(Math.ceil((90 - south) / TILE_DEGREES) - 1, rowMin, 17);
  if ((colMax - colMin + 1) * (rowMax - rowMin + 1) > MAX_VECTOR_TILES) return null;
  const keys: string[] = [];
  for (let row = rowMin; row <= rowMax; row += 1) {
    for (let col = colMin; col <= colMax; col += 1) keys.push(tileKey(col, row));
  }
  return keys;
}

/** L'emprise géographique `[ouest, sud, est, nord]` d'une vue en plan. */
export function flatBounds(view: WorldMapView, frame: Frame): [number, number, number, number] {
  const [west, north] = unprojectFlat(0, 0, view, frame);
  const [east, south] = unprojectFlat(frame.width, frame.height, view, frame);
  return [Math.max(-180, west), Math.max(-90, south), Math.min(180, east), Math.min(90, north)];
}

export interface RasterTile {
  readonly z: number;
  readonly x: number;
  readonly y: number;
  /** Position et côté de l'image, en unités du cadre. */
  readonly left: number;
  readonly top: number;
  readonly size: number;
}

/**
 * Les tuiles d'imagerie qui couvrent une vue en plan, `framePx` la largeur
 * affichée du cadre en pixels.
 */
export function rasterTiles(
  view: WorldMapView,
  frame: Frame,
  framePx: number,
  maxZoom: number = RASTER_MAX_ZOOM,
): RasterTile[] {
  const { scale, x: tx, y: ty } = flatTransform(view, frame);
  /* La fenêtre visible, en unités du monde. */
  const x0 = -tx / scale;
  const x1 = (frame.width - tx) / scale;
  const y0 = -ty / scale;
  const y1 = (frame.height - ty) / scale;
  let z = clampInt(Math.round(toWebZoom(view.zoom, framePx)), 0, maxZoom);
  for (;;) {
    const count = 2 ** z;
    const tile = WORLD_SIZE / count;
    const colMin = clampInt(Math.floor(x0 / tile), 0, count - 1);
    const colMax = clampInt(Math.ceil(x1 / tile) - 1, colMin, count - 1);
    const rowMin = clampInt(Math.floor(y0 / tile), 0, count - 1);
    const rowMax = clampInt(Math.ceil(y1 / tile) - 1, rowMin, count - 1);
    if ((colMax - colMin + 1) * (rowMax - rowMin + 1) > MAX_RASTER_TILES && z > 0) {
      z -= 1;
      continue;
    }
    const tiles: RasterTile[] = [];
    for (let row = rowMin; row <= rowMax; row += 1) {
      for (let col = colMin; col <= colMax; col += 1) {
        tiles.push({
          z,
          x: col,
          y: row,
          left: col * tile * scale + tx,
          top: row * tile * scale + ty,
          size: tile * scale,
        });
      }
    }
    return tiles;
  }
}

/** Ce qui paraît au zoom web courant : `mz ≤ zoom`. */
export function byMinZoom<T extends { readonly mz: number }>(
  items: readonly T[],
  webZoom: number,
): T[] {
  return items.filter((item) => item.mz <= webZoom);
}
