/* =============================================================================
   LA DÉCOUPE DU GLOBE PAR SON HORIZON — sans React, sans DOM.

   Sur le globe orthographique, la face cachée ne se dessine pas. Chaque point
   est tourné vers la vue (`createRotation`) : il est visible quand z ≥ 0.
   La découpe se fait en 3D, contre le plan z = 0 (Sutherland-Hodgman à un
   seul plan), AVANT la projection : découper le dessin projeté laisserait
   passer des arêtes qui traversent la face cachée.

   - Les arêtes sont subdivisées à 2° au plus, interpolées en degrés (les
     données sont définies ainsi) : une longue arête reste courbe à l'écran,
     et le point où elle passe l'horizon est juste.
   - Un anneau qui passe derrière le globe en ressort ailleurs : entre une
     sortie et l'entrée la plus proche sur le cercle, on insère un ARC
     D'HORIZON, échantillonné à 2° (voir `clipRings`).
   - Le SENS DE L'ARC est celui de l'anneau. Un anneau parcouru dans le sens
     direct (aire signée positive en degrés, nord en haut) garde son intérieur
     à gauche ; l'orthographique vue de l'extérieur conserve l'orientation, et
     sur l'horizon l'intérieur visible est du côté du centre du disque : l'arc
     tourne donc dans le sens direct. C'est ce qui règle le CAS POLAIRE, où
     l'arc dépasse 180° — l'arc le plus court peindrait l'autre côté.

   Limites documentées : un anneau dont tout le bord est caché mais qui
   couvrirait toute la face visible n'est pas dessiné (aucun pays n'est aussi
   grand qu'un hémisphère, et un anneau Natural Earth qui contient le centre
   de la vue passe toujours l'horizon : ses arêtes polaires ou son parallèle
   le traversent) ; un anneau qui ressort exactement par où il est entré
   (arc de 0° ou de 360°) prend l'arc nul.
   ========================================================================== */

import { createRotation } from './projection';

/** Une rotation vers la vue : `[x, y, z]`, y vers le bas, visible si z ≥ 0. */
export type Rotation = ReturnType<typeof createRotation>;

/** La plus longue arête dessinée sur le globe, en degrés. */
export const MAX_SEGMENT_DEGREES = 2;

const ARC_STEP = (MAX_SEGMENT_DEGREES * Math.PI) / 180;
const TAU = 2 * Math.PI;
/** Ce qui, sur le disque unité, se confond avec l'horizon. */
/** L'écart d'angle sur l'horizon en deçà duquel deux points sont confondus : 0,06°, l'erreur de corde d'une arête de 2°. */
const ANGLE_EPSILON = 1e-3;
/**
 * La profondeur, sous l'horizon du disque unité, en deçà de laquelle un
 * passage est un frôlement : 1e-5 du rayon, un cinquantième de pixel au
 * zoom 3.
 */
const GRAZING_DEPTH = 1e-5;

/** Le sens d'un anneau en degrés : +1 direct (nord en haut), −1 indirect. */
function orientation(ring: ArrayLike<number>): 1 | -1 {
  let sum = 0;
  const n = ring.length;
  for (let i = 0; i < n; i += 2) {
    const j = (i + 2) % n;
    sum += ring[i] * ring[j + 1] - ring[j] * ring[i + 1];
  }
  return sum < 0 ? -1 : 1;
}

/**
 * Parcourt l'arête `a → b` subdivisée à 2° au plus, et rend chaque point
 * tourné après `a` (fin incluse).
 */
function walkEdge(
  lonA: number,
  latA: number,
  lonB: number,
  latB: number,
  rotate: Rotation,
  visit: (point: [number, number, number]) => void,
) {
  const steps = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(lonB - lonA), Math.abs(latB - latA)) / MAX_SEGMENT_DEGREES),
  );
  for (let k = 1; k <= steps; k += 1) {
    const t = k / steps;
    visit(rotate(lonA + (lonB - lonA) * t, latA + (latB - latA) * t));
  }
}

/** Le point où le segment `a → b` traverse z = 0, ramené sur le cercle unité. */
function horizonPoint(a: readonly number[], b: readonly number[]): [number, number] {
  const t = a[2] / (a[2] - b[2]);
  const x = a[0] + (b[0] - a[0]) * t;
  const y = a[1] + (b[1] - a[1]) * t;
  const length = Math.hypot(x, y) || 1;
  return [x / length, y / length];
}

/** Ajoute l'arc d'horizon de `from` à `to` (exclus), dans le sens `direction`. */
function pushArc(
  out: number[],
  from: readonly [number, number],
  to: readonly [number, number],
  direction: 1 | -1,
) {
  /* Les angles se mesurent nord en haut (−y), comme l'orientation. */
  const start = Math.atan2(-from[1], from[0]);
  const end = Math.atan2(-to[1], to[0]);
  let span = (((direction * (end - start)) % TAU) + TAU) % TAU;
  /* Un point à peine derrière l'autre : l'arc est nul (voir `clipRings`). */
  if (span > TAU - ANGLE_EPSILON) span = 0;
  const steps = Math.ceil(span / ARC_STEP);
  for (let k = 1; k < steps; k += 1) {
    const angle = start + (direction * span * k) / steps;
    out.push(Math.cos(angle), -Math.sin(angle));
  }
}

/** Un passage de l'anneau sur la face visible, de son entrée à sa sortie. */
interface Fragment {
  readonly points: number[];
  /** L'angle, nord en haut, où il entre ; `null` si l'anneau ne passe jamais l'horizon. */
  entry: number | null;
  exit: [number, number] | null;
}

const angleOf = ([x, y]: readonly [number, number]) => Math.atan2(-y, x);

/**
 * Découpe un anneau (`[lon, lat]` à plat, sans point de fermeture) par
 * l'horizon. Rend les anneaux projetés sur le disque unité (`[x, y]` à plat,
 * y vers le bas) : aucun s'il ne reste rien de visible, plusieurs quand un
 * anneau concave passe l'horizon plusieurs fois.
 *
 * LE RACCORD SUIT LE CERCLE, PAS L'ANNEAU (comme `d3-geo`). Les passages
 * visibles sont d'abord collectés ; chaque sortie rejoint ensuite, le long
 * de l'horizon et dans le sens de l'anneau, l'ENTRÉE LA PLUS PROCHE — celle
 * qui la suit sur le cercle, pas celle qui la suit dans l'anneau. Relier la
 * sortie à l'entrée suivante de l'anneau tirait, pour un pays concave (le
 * Canada, le Mali, la Russie), un arc de près de 360° qui peignait tout le
 * disque.
 */
export function clipRings(ring: ArrayLike<number>, rotate: Rotation): number[][] {
  const n = ring.length;
  if (n < 6) return [];
  const direction = orientation(ring);
  const fragments: Fragment[] = [];
  let previous = rotate(ring[n - 2], ring[n - 1]);
  let current: Fragment | null = previous[2] >= 0 ? { points: [], entry: null, exit: null } : null;
  if (current) fragments.push(current);

  const visit = (point: [number, number, number]) => {
    if (point[2] >= 0) {
      if (!current) {
        const entry = horizonPoint(previous, point);
        current = { points: [entry[0], entry[1]], entry: angleOf(entry), exit: null };
        fragments.push(current);
      }
      current.points.push(point[0], point[1]);
    } else if (current) {
      const exit = horizonPoint(previous, point);
      current.points.push(exit[0], exit[1]);
      current.exit = exit;
      current = null;
    }
    previous = point;
  };

  for (let i = 0; i < n; i += 2) {
    const from = i === 0 ? n - 2 : i - 2;
    walkEdge(ring[from], ring[from + 1], ring[i], ring[i + 1], rotate, visit);
  }

  /* L'anneau a commencé sur la face visible : son premier passage est la
     suite du dernier, ouvert à la fin du parcours. */
  const first = fragments[0];
  const last = fragments[fragments.length - 1];
  if (first && first.entry === null && first !== last && last && last.exit === null) {
    last.points.push(...first.points);
    last.exit = first.exit;
    fragments.shift();
  }
  /* Jamais passé l'horizon : l'anneau est entièrement visible. */
  if (fragments.length === 1 && fragments[0].exit === null) {
    return fragments[0].points.length >= 6 ? [fragments[0].points] : [];
  }
  /* UN PASSAGE QUI RASE L'HORIZON NE PEINT RIEN, et le sens de son entrée
     et de sa sortie, à quelques millionièmes d'écart, n'est plus que du bruit
     d'arrondi : il se raccordait en tournant tout le cercle (le Soudan rasant
     le limbe, vu de 100° E, 60° S). Il est écarté. */
  for (let i = fragments.length - 1; i >= 0; i -= 1) {
    const { points } = fragments[i];
    let grazing = true;
    for (let k = 0; k < points.length && grazing; k += 2) {
      grazing = Math.hypot(points[k], points[k + 1]) > 1 - GRAZING_DEPTH;
    }
    if (grazing) fragments.splice(i, 1);
  }
  if (fragments.length === 0) return [];

  const out: number[][] = [];
  const pending = new Set(fragments);
  for (const start of fragments) {
    if (!pending.has(start)) continue;
    const points: number[] = [];
    let fragment: Fragment = start;
    for (;;) {
      pending.delete(fragment);
      points.push(...fragment.points);
      const exit = fragment.exit;
      if (!exit) break;
      /* L'entrée la plus proche dans le sens de l'anneau, parmi les passages
         restants et le premier de ce contour, qui le referme. */
      const from = angleOf(exit);
      let next: Fragment | null = null;
      let best = Infinity;
      for (const candidate of [start, ...pending]) {
        if (candidate.entry === null) continue;
        let span = (((direction * (candidate.entry - from)) % TAU) + TAU) % TAU;
        /* UNE ENTRÉE À PEINE DERRIÈRE LA SORTIE EST À ZÉRO, PAS À UN TOUR.
           Quand l'anneau plonge un instant sous l'horizon, sa sortie et sa
           rentrée sont presque confondues, et les arêtes interpolées en degrés
           puis coupées à la corde peuvent inverser leur ordre de quelques
           millionièmes : le raccord tournait alors tout le cercle (le Soudan
           rasant le limbe, vu de 80° O, 60° N). */
        if (span > TAU - ANGLE_EPSILON) span = 0;
        if (span < best) {
          best = span;
          next = candidate;
        }
      }
      if (!next) break;
      const [ex, ey] = [Math.cos(next.entry ?? 0), -Math.sin(next.entry ?? 0)];
      pushArc(points, exit, [ex, ey], direction);
      if (next === start) break;
      fragment = next;
    }
    if (points.length >= 6) out.push(points);
  }
  return out;
}

/**
 * Découpe une ligne (`[lon, lat]` à plat) par l'horizon : un morceau projeté
 * par passage sur la face visible, sans arc.
 */
export function clipLine(line: ArrayLike<number>, rotate: Rotation): number[][] {
  const pieces: number[][] = [];
  if (line.length < 4) return pieces;
  let previous = rotate(line[0], line[1]);
  let current: number[] | null = previous[2] >= 0 ? [previous[0], previous[1]] : null;
  if (current) pieces.push(current);

  const visit = (point: [number, number, number]) => {
    const pointIn = point[2] >= 0;
    if (pointIn) {
      if (!current) {
        const entry = horizonPoint(previous, point);
        current = [entry[0], entry[1]];
        pieces.push(current);
      }
      current.push(point[0], point[1]);
    } else if (current) {
      const exit = horizonPoint(previous, point);
      current.push(exit[0], exit[1]);
      current = null;
    }
    previous = point;
  };

  for (let i = 2; i < line.length; i += 2) {
    walkEdge(line[i - 2], line[i - 1], line[i], line[i + 1], rotate, visit);
  }
  return pieces.filter((piece) => piece.length >= 4);
}
