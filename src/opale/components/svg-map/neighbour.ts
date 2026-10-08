import type { Point } from './viewport';

/** Les quatre flèches du clavier. */
export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/** La direction de chaque flèche, en coordonnées d'écran (y vers le bas). */
export const ARROW_DIRECTIONS: Readonly<Record<ArrowKey, readonly [number, number]>> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

/** Vrai pour l'une des quatre flèches, et pour elles seules. */
export function isArrowKey(key: string): key is ArrowKey {
  return Object.hasOwn(ARROW_DIRECTIONS, key);
}

/**
 * LES FLÈCHES SUIVENT LA GÉOGRAPHIE, PAS LA LISTE. L'ordre d'une liste ne dit
 * rien de la carte — il peut même être mélangé — et « droite » doit mener à
 * droite. Chaque flèche vise le point le plus proche dans sa direction,
 * l'écart perpendiculaire pesant double ; un candidat à moins d'un demi-point
 * dans la direction ne compte pas. Sans voisin, `null` : le focus reste où il
 * est.
 *
 * @param centers Le centre de chaque élément, en coordonnées d'écran (y vers le bas).
 * @param fromId L'élément d'où l'on part.
 * @param key La flèche pressée.
 */
export function nearestInDirection(
  centers: ReadonlyMap<string, Point>,
  fromId: string,
  key: ArrowKey,
): string | null {
  const origin = centers.get(fromId);
  if (!origin) return null;
  const [ax, ay] = ARROW_DIRECTIONS[key];
  let best: { id: string; score: number } | null = null;
  for (const [candidate, c] of centers) {
    if (candidate === fromId) continue;
    const along = (c.x - origin.x) * ax + (c.y - origin.y) * ay;
    if (along <= 0.5) continue;
    const across = Math.abs((c.x - origin.x) * ay) + Math.abs((c.y - origin.y) * ax);
    const score = along + 2 * across;
    if (!best || score < best.score) best = { id: candidate, score };
  }
  return best?.id ?? null;
}
