/* =============================================================================
   LES TRACÉS SVG DE `WorldMap` — sans React, sans DOM.

   PLAN. Le tracé est écrit UNE FOIS par fichier, en unités du monde (0…1000),
   et mis en cache : pendant un geste, seule la transformation du `<g>` qui
   le porte change. Un `M` absolu par anneau ou ligne, puis des `l` relatifs ;
   la précision suit le pas de quantification du fichier (deux décimales en
   110m et 50m, trois en 10m). Les arrondis portent sur les positions
   absolues, pas sur les deltas : l'erreur ne s'accumule pas.

   GLOBE. La découpe par l'horizon dépend de la rotation : le tracé est
   refait à chaque rendu, en unités du cadre, à partir des anneaux décodés
   une fois par fichier.

   Dans les deux cas : un `<path>` par pays pour les remplissages (règle
   `evenodd` : les trous et les recouvrements de tuiles se peignent juste),
   un seul par couche de lignes et par fichier.
   ========================================================================== */

import { clipLine, clipRing, type Rotation } from './clip';
import {
  decodeRing,
  type EncodedLine,
  type WorldDataFile,
  type WorldDataRankedLine,
} from './data-format';
import { byMinZoom } from './lod';
import { worldPoint } from './view';

export interface CountryPath {
  readonly id: string;
  readonly d: string;
}

export interface FlatPaths {
  readonly countries: readonly CountryPath[];
  readonly lakes: string;
  readonly coast: string;
  readonly borders: string;
  /** Les fleuves qui paraissent au zoom web donné. */
  rivers(webZoom: number): string;
  /** Les limites régionales qui paraissent au zoom web donné. */
  admin1(webZoom: number): string;
}

export interface GlobePaths {
  readonly countries: readonly CountryPath[];
  readonly lakes: string;
  readonly coast: string;
  readonly borders: string;
  readonly rivers: string;
}

/** Un entier à `digits` décimales fixes, écrit au plus court : `12.34`, `-.5`, `3`. */
export function formatFixed(value: number, digits: number): string {
  const unit = 10 ** digits;
  const sign = value < 0 ? '-' : '';
  const magnitude = Math.abs(value);
  const whole = Math.floor(magnitude / unit);
  const fraction = magnitude - whole * unit;
  if (fraction === 0) return `${sign}${whole}`;
  const decimals = String(fraction).padStart(digits, '0').replace(/0+$/, '');
  return `${sign}${whole === 0 ? '' : whole}.${decimals}`;
}

/**
 * Écrit une suite de points absolus (entiers à `digits` décimales fixes) :
 * `M` absolu, puis `l` relatifs, segments nuls omis.
 */
function writePath(out: string[], points: ArrayLike<number>, digits: number, closed: boolean) {
  const n = points.length;
  if (n < 4) return;
  let x = points[0];
  let y = points[1];
  const parts = [`M${formatFixed(x, digits)}`, pairTail(formatFixed(y, digits))];
  let started = false;
  for (let i = 2; i < n; i += 2) {
    const dx = points[i] - x;
    const dy = points[i + 1] - y;
    if (dx === 0 && dy === 0) continue;
    const first = formatFixed(dx, digits);
    parts.push(started ? (first.startsWith('-') ? first : ` ${first}`) : `l${first}`);
    parts.push(pairTail(formatFixed(dy, digits)));
    started = true;
    x = points[i];
    y = points[i + 1];
  }
  if (!started) return;
  if (closed) parts.push('z');
  out.push(parts.join(''));
}

/** Le second nombre d'une paire : le signe moins tient lieu de séparateur. */
const pairTail = (text: string) => (text.startsWith('-') ? text : `,${text}`);

/* -----------------------------------------------------------------------------
   Plan.
   -------------------------------------------------------------------------- */

/** Les positions absolues d'une ligne, en unités du monde × 10^digits. */
function flatPoints(line: EncodedLine, file: WorldDataFile, digits: number): Int32Array {
  const degrees = decodeRing(line, file.q);
  const unit = 10 ** digits;
  const out = new Int32Array(degrees.length);
  for (let i = 0; i < degrees.length; i += 2) {
    const [x, y] = worldPoint(degrees[i], degrees[i + 1]);
    out[i] = Math.round(x * unit);
    out[i + 1] = Math.round(y * unit);
  }
  return out;
}

const digitsFor = (file: WorldDataFile) => (file.q[2] >= 0.005 ? 2 : 3);

/** Les lignes classées par `min_zoom`, et le tracé de chaque préfixe, mis en cache. */
function rankedPaths(
  items: readonly WorldDataRankedLine[] | undefined,
  write: (line: EncodedLine) => string,
): (webZoom: number) => string {
  const sorted = [...(items ?? [])].sort((a, b) => a.mz - b.mz);
  const pieces = sorted.map((item) => write(item.l));
  const cache = new Map<number, string>();
  return (webZoom) => {
    const count = byMinZoom(sorted, webZoom).length;
    let d = cache.get(count);
    if (d === undefined) {
      d = pieces.slice(0, count).join('');
      cache.set(count, d);
    }
    return d;
  };
}

const flatCache = new WeakMap<WorldDataFile, FlatPaths>();

/** Les tracés en plan d'un fichier, calculés une fois. */
export function flatPaths(file: WorldDataFile): FlatPaths {
  const known = flatCache.get(file);
  if (known) return known;
  const digits = digitsFor(file);
  const write = (lines: readonly EncodedLine[], closed: boolean) => {
    const out: string[] = [];
    for (const line of lines) writePath(out, flatPoints(line, file, digits), digits, closed);
    return out.join('');
  };
  const paths: FlatPaths = {
    countries: file.countries.flatMap(({ id, r }) => {
      const d = write(r.flat(), true);
      return d ? [{ id, d }] : [];
    }),
    lakes: write((file.lakes ?? []).flat(), true),
    coast: write(file.coast, false),
    borders: write(file.borders, false),
    rivers: rankedPaths(file.rivers, (line) => write([line], false)),
    admin1: rankedPaths(file.admin1, (line) => write([line], false)),
  };
  flatCache.set(file, paths);
  return paths;
}

/* -----------------------------------------------------------------------------
   Globe.
   -------------------------------------------------------------------------- */

interface DecodedFile {
  readonly countries: readonly { readonly id: string; readonly rings: readonly Float64Array[] }[];
  readonly lakes: readonly Float64Array[];
  readonly coast: readonly Float64Array[];
  readonly borders: readonly Float64Array[];
  readonly rivers: readonly { readonly mz: number; readonly line: Float64Array }[];
}

const decodedCache = new WeakMap<WorldDataFile, DecodedFile>();

function decoded(file: WorldDataFile): DecodedFile {
  const known = decodedCache.get(file);
  if (known) return known;
  const decode = (line: EncodedLine) => decodeRing(line, file.q);
  const result: DecodedFile = {
    countries: file.countries.map(({ id, r }) => ({ id, rings: r.flat().map(decode) })),
    lakes: (file.lakes ?? []).flat().map(decode),
    coast: file.coast.map(decode),
    borders: file.borders.map(decode),
    rivers: (file.rivers ?? []).map(({ mz, l }) => ({ mz, line: decode(l) })),
  };
  decodedCache.set(file, result);
  return result;
}

export interface GlobeOptions {
  readonly rotate: Rotation;
  /** Le centre et le rayon du disque, en unités du cadre. */
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  /** Le zoom web, pour filtrer les fleuves. */
  readonly webZoom: number;
}

/** Une décimale en unités du cadre : un dixième de pixel à l'échelle 1. */
const GLOBE_DIGITS = 1;

/** Les tracés du globe pour une rotation : refaits à chaque rendu. */
export function globePaths(
  file: WorldDataFile,
  { rotate, cx, cy, radius, webZoom }: GlobeOptions,
): GlobePaths {
  const data = decoded(file);
  const unit = 10 ** GLOBE_DIGITS;
  const toFrame = (disk: readonly number[]) => {
    const out = new Int32Array(disk.length);
    for (let i = 0; i < disk.length; i += 2) {
      out[i] = Math.round((cx + disk[i] * radius) * unit);
      out[i + 1] = Math.round((cy + disk[i + 1] * radius) * unit);
    }
    return out;
  };
  const rings = (items: readonly Float64Array[]) => {
    const out: string[] = [];
    for (const ring of items) {
      const clipped = clipRing(ring, rotate);
      if (clipped) writePath(out, toFrame(clipped), GLOBE_DIGITS, true);
    }
    return out.join('');
  };
  const lines = (items: readonly Float64Array[]) => {
    const out: string[] = [];
    for (const line of items) {
      for (const piece of clipLine(line, rotate))
        writePath(out, toFrame(piece), GLOBE_DIGITS, false);
    }
    return out.join('');
  };
  return {
    countries: data.countries.flatMap(({ id, rings: items }) => {
      const d = rings(items);
      return d ? [{ id, d }] : [];
    }),
    lakes: rings(data.lakes),
    coast: lines(data.coast),
    borders: lines(data.borders),
    rivers: lines(byMinZoom(data.rivers, webZoom).map((item) => item.line)),
  };
}
