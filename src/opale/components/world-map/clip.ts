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
   - Un anneau qui passe derrière le globe en ressort ailleurs : entre la
     sortie et l'entrée, on insère un ARC D'HORIZON, échantillonné à 2°.
   - Le SENS DE L'ARC est celui de l'anneau. Un anneau parcouru dans le sens
     direct (aire signée positive en degrés, nord en haut) garde son intérieur
     à gauche ; l'orthographique vue de l'extérieur conserve l'orientation, et
     sur l'horizon l'intérieur visible est du côté du centre du disque : l'arc
     tourne donc dans le sens direct. C'est ce qui règle le CAS POLAIRE, où
     l'arc dépasse 180° — l'arc le plus court peindrait l'autre côté.

   Limites documentées : un anneau dont tout le bord est caché mais qui
   couvrirait toute la face visible n'est pas dessiné (aucun pays n'est aussi
   grand qu'un hémisphère) ; un anneau qui ressort exactement par où il est
   entré (arc de 0° ou de 360°) prend l'arc nul.
   ========================================================================== */

import { createRotation } from './projection';

/** Une rotation vers la vue : `[x, y, z]`, y vers le bas, visible si z ≥ 0. */
export type Rotation = ReturnType<typeof createRotation>;

/** La plus longue arête dessinée sur le globe, en degrés. */
export const MAX_SEGMENT_DEGREES = 2;

const ARC_STEP = (MAX_SEGMENT_DEGREES * Math.PI) / 180;
const TAU = 2 * Math.PI;

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
  const span = (((direction * (end - start)) % TAU) + TAU) % TAU;
  const steps = Math.ceil(span / ARC_STEP);
  for (let k = 1; k < steps; k += 1) {
    const angle = start + (direction * span * k) / steps;
    out.push(Math.cos(angle), -Math.sin(angle));
  }
}

/**
 * Découpe un anneau (`[lon, lat]` à plat, sans point de fermeture) par
 * l'horizon. Rend l'anneau projeté sur le disque unité (`[x, y]` à plat, y
 * vers le bas), ou `null` s'il ne reste rien de visible.
 */
export function clipRing(ring: ArrayLike<number>, rotate: Rotation): number[] | null {
  const n = ring.length;
  if (n < 6) return null;
  const direction = orientation(ring);
  const out: number[] = [];
  let previous = rotate(ring[n - 2], ring[n - 1]);
  let firstEntry: [number, number] | null = null;
  let pendingExit: [number, number] | null = null;

  const visit = (current: [number, number, number]) => {
    const currentIn = current[2] >= 0;
    const previousIn = previous[2] >= 0;
    if (currentIn) {
      if (!previousIn) {
        const entry = horizonPoint(previous, current);
        if (pendingExit) {
          pushArc(out, pendingExit, entry, direction);
          pendingExit = null;
        } else if (!firstEntry) {
          firstEntry = entry;
        }
        out.push(entry[0], entry[1]);
      }
      out.push(current[0], current[1]);
    } else if (previousIn) {
      const exit = horizonPoint(previous, current);
      out.push(exit[0], exit[1]);
      pendingExit = exit;
    }
    previous = current;
  };

  for (let i = 0; i < n; i += 2) {
    const from = i === 0 ? n - 2 : i - 2;
    walkEdge(ring[from], ring[from + 1], ring[i], ring[i + 1], rotate, visit);
  }
  /* La dernière sortie rejoint la première entrée : l'anneau se referme. */
  if (pendingExit && firstEntry) pushArc(out, pendingExit, firstEntry, direction);

  return out.length >= 6 ? out : null;
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
