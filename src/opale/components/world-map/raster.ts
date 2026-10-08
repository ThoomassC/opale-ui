/* =============================================================================
   L'IMAGERIE DE `WorldMap` — sans React, sans DOM.

   Ce module n'est importé que par les fonds satellite, chargés à la
   demande : le dessin vectoriel n'en paie rien.

   - PLAN : des tuiles Web Mercator, z = round(zoom web) borné à [0, max] ;
     au-delà, les tuiles du niveau max sont agrandies (sur-zoom), jamais plus
     de 48 images.
   - GLOBE : les 16 tuiles du niveau 2 forment une image Mercator de
     1024 × 1024, recomposée UNE FOIS en équirectangulaire (latitudes
     régulières) : chaque pixel du disque y lit ensuite son texel par
     l'inverse orthographique. Les vecteurs du disque — le point de la sphère
     sous chaque pixel, vu de face — se calculent une fois par taille ; seule
     la rotation change d'une image à l'autre.
   ========================================================================== */

import { mercator } from './projection';
import {
  flatTransform,
  webZoom as toWebZoom,
  WORLD_SIZE,
  type Frame,
  type WorldMapView,
} from './view';

/** Le plus d'images d'imagerie posées pour une vue. */
export const MAX_RASTER_TILES = 48;
/** Le niveau le plus fin de l'imagerie (NASA GIBS, `GoogleMapsCompatible_Level8`). */
export const RASTER_MAX_ZOOM = 8;

const clampInt = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

/** L'adresse d'une tuile : `{z}`, `{x}` et `{y}` remplacés partout. */
export function tileUrl(
  template: string,
  { z, x, y }: { readonly z: number; readonly x: number; readonly y: number },
): string {
  return template
    .replaceAll('{z}', String(z))
    .replaceAll('{x}', String(x))
    .replaceAll('{y}', String(y));
}

/** Une image RVBA en mémoire, rangée par rangée depuis le haut. */
export interface Texture {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

/**
 * Recompose une image Mercator (le monde carré, nord en haut) en
 * équirectangulaire de `width × height`. Au-delà de ±85,05°, où Mercator
 * s'arrête, la calotte prend la rangée du bord.
 */
export function equirectangular(source: Texture, width: number, height: number): Texture {
  const data = new Uint8ClampedArray(width * height * 4);
  const columns = new Int32Array(width);
  for (let i = 0; i < width; i += 1) {
    columns[i] = Math.min(source.width - 1, Math.floor(((i + 0.5) / width) * source.width));
  }
  for (let row = 0; row < height; row += 1) {
    const latitude = 90 - ((row + 0.5) / height) * 180;
    const sourceRow = clampInt(
      Math.floor(mercator(0, latitude)[1] * source.height),
      0,
      source.height - 1,
    );
    const from = sourceRow * source.width;
    const to = row * width;
    for (let i = 0; i < width; i += 1) {
      const s = (from + columns[i]) * 4;
      const d = (to + i) * 4;
      data[d] = source.data[s];
      data[d + 1] = source.data[s + 1];
      data[d + 2] = source.data[s + 2];
      data[d + 3] = source.data[s + 3];
    }
  }
  return { data, width, height };
}

/** Un rectangle du cadre, en unités du cadre. */
export interface FrameRect {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/**
 * Les vecteurs du disque pour une toile de `columns × rows` pixels posée sur
 * `rect` : pour chaque pixel, le point `[x, y, z]` de la sphère unité vue de
 * face (x vers l'est, y vers le bas, z vers l'observateur), NaN hors du
 * disque de centre `(cx, cy)` et de rayon `radius`.
 */
export function diskVectors(
  columns: number,
  rows: number,
  { x0, y0, x1, y1 }: FrameRect,
  cx: number,
  cy: number,
  radius: number,
): Float32Array {
  const out = new Float32Array(columns * rows * 3);
  for (let j = 0; j < rows; j += 1) {
    const v = (y0 + ((j + 0.5) / rows) * (y1 - y0) - cy) / radius;
    for (let i = 0; i < columns; i += 1) {
      const u = (x0 + ((i + 0.5) / columns) * (x1 - x0) - cx) / radius;
      const k = (j * columns + i) * 3;
      const zz = 1 - u * u - v * v;
      if (zz < 0) {
        out[k] = Number.NaN;
      } else {
        out[k] = u;
        out[k + 1] = v;
        out[k + 2] = Math.sqrt(zz);
      }
    }
  }
  return out;
}

const RAD = Math.PI / 180;

/**
 * Peint dans `out` (RVBA) chaque pixel du disque avec le texel de la
 * texture équirectangulaire qu'il montre, la vue centrée sur
 * `(longitude0, latitude0)`. L'inverse de `createRotation` : la latitude par
 * son sinus, la longitude par `atan2` — deux appels par pixel, rien d'autre.
 */
export function sampleGlobe(
  texture: Texture,
  disk: Float32Array,
  longitude0: number,
  latitude0: number,
  out: Uint8ClampedArray,
): void {
  const sinPhi0 = Math.sin(latitude0 * RAD);
  const cosPhi0 = Math.cos(latitude0 * RAD);
  const { data, width, height } = texture;
  const toColumn = width / (2 * Math.PI);
  const toRow = height / Math.PI;
  const lambda0 = longitude0 * RAD + Math.PI;
  const pixels = disk.length / 3;
  for (let p = 0; p < pixels; p += 1) {
    const x = disk[p * 3];
    const o = p * 4;
    if (Number.isNaN(x)) {
      out[o + 3] = 0;
      continue;
    }
    const up = -disk[p * 3 + 1];
    const z = disk[p * 3 + 2];
    const sinPhi = cosPhi0 * up + sinPhi0 * z;
    const phi = Math.asin(sinPhi > 1 ? 1 : sinPhi < -1 ? -1 : sinPhi);
    const lambda = lambda0 + Math.atan2(x, cosPhi0 * z - sinPhi0 * up);
    let column = Math.floor(lambda * toColumn) % width;
    if (column < 0) column += width;
    const row = Math.min(height - 1, Math.max(0, Math.floor((Math.PI / 2 - phi) * toRow)));
    const t = (row * width + column) * 4;
    out[o] = data[t];
    out[o + 1] = data[t + 1];
    out[o + 2] = data[t + 2];
    /* Un texel que la texture n'a pas (une tuile en échec) reste transparent :
       la toile laisse voir l'eau posée dessous, pas un coin noir. */
    out[o + 3] = data[t + 3];
  }
}

/** Le temps d'une image, au-delà duquel le globe ne se repeint plus pendant un geste. */
export const FRAME_BUDGET_MS = 16;

/**
 * Le garde-fou de la toile du globe : deux images de geste lentes À LA
 * SUITE, et le globe ne se repeint plus qu'au repos. Une image qui a
 * recalculé les vecteurs du disque (nouvelle taille de toile) ne compte
 * pas : elle paie un travail que les suivantes n'ont plus. Une image au
 * repos remet le compte à zéro : chaque geste a sa chance.
 */
export function frameGuard(budget: number = FRAME_BUDGET_MS) {
  let slow = 0;
  return {
    /** Vrai si cette image de geste doit être sautée. */
    skip: (moving: boolean) => moving && slow >= 2,
    record(ms: number, { moving, resized = false }: { moving: boolean; resized?: boolean }) {
      if (!moving) slow = 0;
      else if (!resized) slow = ms > budget ? slow + 1 : 0;
    },
  };
}
