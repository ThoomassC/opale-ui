/* =============================================================================
   LES TRACÉS DU GLOBE — sans React, sans DOM.

   La découpe par l'horizon dépend de la rotation : le tracé est refait à
   chaque rendu, en unités du cadre, à partir des anneaux décodés une fois
   par fichier. Ce module n'est importé que par le globe, chargé à la
   demande : le plan n'en paie rien.

   LA FACE CACHÉE NE COÛTE RIEN. Chaque anneau et chaque ligne est borné, au
   décodage, par une CALOTTE : la direction moyenne de ses points et le plus
   grand écart angulaire à celle-ci. Une calotte entièrement derrière
   l'horizon est écartée d'un seul produit scalaire, sans découpe ni
   subdivision — la moitié du monde, à chaque image d'un geste.
   ========================================================================== */

import { clipLine, clipRing, MAX_SEGMENT_DEGREES, type Rotation } from './clip';
import { decodeRing, type EncodedLine, type WorldDataFile } from './data-format';
import { byMinZoom } from './lod';
import { writePath, type CountryPath } from './path-builder';

export interface GlobePaths {
  readonly countries: readonly CountryPath[];
  readonly lakes: string;
  readonly coast: string;
  readonly borders: string;
  readonly rivers: string;
}

/** La calotte qui borne un anneau : son centre en degrés et son rayon en radians. */
export interface Cap {
  readonly longitude: number;
  readonly latitude: number;
  readonly radius: number;
}

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
/* Une arête est interpolée en degrés, pas sur le grand cercle : elle peut
   bomber un peu hors de la calotte de ses sommets. La marge le couvre. */
const CAP_MARGIN = MAX_SEGMENT_DEGREES * RAD;

/** La calotte d'une suite de points `[lon, lat]` à plat. */
export function capOf(points: ArrayLike<number>): Cap {
  const n = points.length / 2;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const zs = new Float64Array(n);
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (let i = 0; i < n; i += 1) {
    const lambda = points[i * 2] * RAD;
    const phi = points[i * 2 + 1] * RAD;
    xs[i] = Math.cos(phi) * Math.cos(lambda);
    ys[i] = Math.cos(phi) * Math.sin(lambda);
    zs[i] = Math.sin(phi);
    sx += xs[i];
    sy += ys[i];
    sz += zs[i];
  }
  const length = Math.hypot(sx, sy, sz);
  /* Des points répartis tout autour du globe n'ont pas de direction : la
     calotte couvre tout, elle n'est jamais écartée. */
  if (length < 1e-9) return { longitude: 0, latitude: 0, radius: Math.PI };
  sx /= length;
  sy /= length;
  sz /= length;
  let minDot = 1;
  for (let i = 0; i < n; i += 1) minDot = Math.min(minDot, xs[i] * sx + ys[i] * sy + zs[i] * sz);
  return {
    longitude: Math.atan2(sy, sx) * DEG,
    latitude: Math.asin(Math.max(-1, Math.min(1, sz))) * DEG,
    radius: Math.acos(Math.max(-1, minDot)) + CAP_MARGIN,
  };
}

/**
 * Vrai si la calotte est entièrement sur la face cachée : son centre est à
 * plus de 90° + rayon du centre de la vue, soit cos < −sin(rayon).
 */
export function hiddenCap(cap: Cap, rotate: Rotation): boolean {
  return cap.radius < Math.PI / 2 && rotate(cap.longitude, cap.latitude)[2] < -Math.sin(cap.radius);
}

interface Shape {
  readonly points: Float64Array;
  readonly cap: Cap;
}

interface DecodedFile {
  readonly countries: readonly { readonly id: string; readonly rings: readonly Shape[] }[];
  readonly lakes: readonly Shape[];
  readonly coast: readonly Shape[];
  readonly borders: readonly Shape[];
  readonly rivers: readonly (Shape & { readonly mz: number })[];
}

const decodedCache = new WeakMap<WorldDataFile, DecodedFile>();

function decoded(file: WorldDataFile): DecodedFile {
  const known = decodedCache.get(file);
  if (known) return known;
  const shape = (line: EncodedLine): Shape => {
    const points = decodeRing(line, file.q);
    return { points, cap: capOf(points) };
  };
  const result: DecodedFile = {
    countries: file.countries.map(({ id, r }) => ({ id, rings: r.flat().map(shape) })),
    lakes: (file.lakes ?? []).flat().map(shape),
    coast: file.coast.map(shape),
    borders: file.borders.map(shape),
    rivers: (file.rivers ?? []).map(({ mz, l }) => ({ mz, ...shape(l) })),
  };
  decodedCache.set(file, result);
  return result;
}

/** Le disque du globe dans le cadre, et la rotation de la vue. */
export interface GlobeFrame {
  readonly rotate: Rotation;
  /** Le centre et le rayon du disque, en unités du cadre. */
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

export interface GlobeOptions extends GlobeFrame {
  /** Le zoom web, pour filtrer les fleuves. */
  readonly webZoom: number;
}

/** Une décimale en unités du cadre : un dixième de pixel à l'échelle 1. */
const GLOBE_DIGITS = 1;

/** Les écrivains de tracés d'un disque : anneaux fermés et lignes ouvertes. */
function writers({ rotate, cx, cy, radius }: GlobeFrame) {
  const unit = 10 ** GLOBE_DIGITS;
  const toFrame = (disk: readonly number[]) => {
    const out = new Int32Array(disk.length);
    for (let i = 0; i < disk.length; i += 2) {
      out[i] = Math.round((cx + disk[i] * radius) * unit);
      out[i + 1] = Math.round((cy + disk[i + 1] * radius) * unit);
    }
    return out;
  };
  return {
    rings: (items: readonly Shape[]) => {
      const out: string[] = [];
      for (const { points, cap } of items) {
        if (hiddenCap(cap, rotate)) continue;
        const clipped = clipRing(points, rotate);
        if (clipped) writePath(out, toFrame(clipped), GLOBE_DIGITS, true);
      }
      return out.join('');
    },
    lines: (items: readonly (Shape | Float64Array)[]) => {
      const out: string[] = [];
      for (const item of items) {
        const shape = item instanceof Float64Array ? { points: item, cap: null } : item;
        if (shape.cap && hiddenCap(shape.cap, rotate)) continue;
        for (const piece of clipLine(shape.points, rotate)) {
          writePath(out, toFrame(piece), GLOBE_DIGITS, false);
        }
      }
      return out.join('');
    },
  };
}

/** Les tracés du globe pour une rotation : refaits à chaque rendu. */
export function globePaths(file: WorldDataFile, options: GlobeOptions): GlobePaths {
  const data = decoded(file);
  const { rings, lines } = writers(options);
  return {
    countries: data.countries.flatMap(({ id, rings: items }) => {
      const d = rings(items);
      return d ? [{ id, d }] : [];
    }),
    lakes: rings(data.lakes),
    coast: lines(data.coast),
    borders: lines(data.borders),
    rivers: lines(byMinZoom(data.rivers, options.webZoom)),
  };
}

const graticuleCache = new Map<number, readonly Float64Array[]>();

/** Les méridiens et parallèles d'un pas en degrés, en `[lon, lat]` à plat. */
function graticuleLines(step: number): readonly Float64Array[] {
  const known = graticuleCache.get(step);
  if (known) return known;
  const lines: Float64Array[] = [];
  /* Les méridiens s'arrêtent avant les pôles, où ils se rejoignent tous. */
  const pole = 90 - Math.min(step, 10);
  for (let longitude = -180; longitude < 180; longitude += step) {
    lines.push(new Float64Array([longitude, -pole, longitude, pole]));
  }
  for (let latitude = step - 90; latitude < 90; latitude += step) {
    const line = new Float64Array(2 * 37);
    for (let k = 0; k <= 36; k += 1) line.set([k * 10 - 180, latitude], k * 2);
    lines.push(line);
  }
  graticuleCache.set(step, lines);
  return lines;
}

/** Le graticule visible, d'un pas de `step` degrés : un seul tracé. */
export function graticule(step: number, frame: GlobeFrame): string {
  return writers(frame).lines(graticuleLines(step));
}
