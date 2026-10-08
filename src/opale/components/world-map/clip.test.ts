import { describe, expect, it } from 'vitest';

import { clipLine, clipRing, MAX_SEGMENT_DEGREES } from './clip';
import { createRotation } from './projection';

/** Une suite de `[lon, lat]` à plat. */
const flat = (points: readonly (readonly [number, number])[]) => points.flat();

/** Aire signée d'un anneau à plat (repère de l'écran, y vers le bas). */
function area(ring: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 2) {
    const j = (i + 2) % ring.length;
    sum += ring[i] * ring[j + 1] - ring[j] * ring[i + 1];
  }
  return sum / 2;
}

const radius = (ring: readonly number[], i: number) => Math.hypot(ring[i], ring[i + 1]);

const points = (ring: readonly number[]) =>
  Array.from({ length: ring.length / 2 }, (_, k) => [ring[2 * k], ring[2 * k + 1]] as const);

/** Un parallèle échantillonné tous les `step` degrés, d'ouest en est. */
const parallel = (lat: number, from: number, to: number, step = 5) => {
  const out: [number, number][] = [];
  for (let lon = from; step > 0 ? lon <= to : lon >= to; lon += step) out.push([lon, lat]);
  return out;
};

describe('clipRing', () => {
  const facing = createRotation(0, 0);

  it('rend tel quel, projeté, un anneau entièrement visible', () => {
    const ring = clipRing(
      flat([
        [0, 0],
        [1, 0],
        [1, 1],
      ]),
      facing,
    );
    expect(ring).not.toBeNull();
    expect(ring).toHaveLength(6);
    expect(ring?.[0]).toBeCloseTo(0, 12);
    expect(ring?.[2]).toBeCloseTo(Math.sin(Math.PI / 180), 12);
  });

  it('rend null pour un anneau entièrement sur la face cachée', () => {
    expect(
      clipRing(
        flat([
          [170, 0],
          [175, 0],
          [175, 5],
        ]),
        facing,
      ),
    ).toBeNull();
  });

  it('subdivise les arêtes à 2° au plus', () => {
    expect(MAX_SEGMENT_DEGREES).toBe(2);
    const ring = clipRing(
      flat([
        [0, 0],
        [10, 0],
        [10, 1],
      ]),
      facing,
    );
    /* Les deux arêtes de 10° deviennent cinq segments chacune : 8 points ajoutés. */
    expect(ring).toHaveLength((3 + 8) * 2);
  });

  it('coupe sur l’horizon et y insère un arc', () => {
    /* Un carré à cheval sur le limbe est (90°E). */
    const ring = clipRing(
      flat([
        [80, -10],
        [100, -10],
        [100, 10],
        [80, 10],
      ]),
      facing,
    );
    expect(ring).not.toBeNull();
    const all = ring ?? [];
    for (let i = 0; i < all.length; i += 2) expect(radius(all, i)).toBeLessThanOrEqual(1 + 1e-9);
    const onHorizon = points(all).filter(([x, y]) => Math.abs(Math.hypot(x, y) - 1) < 1e-9);
    expect(onHorizon.length).toBeGreaterThanOrEqual(3);
    /* L'arc reste du côté du carré : aucun point à gauche du disque. */
    expect(points(all).every(([x]) => x > 0)).toBe(true);
  });

  /* LE CAS POLAIRE. « Tout ce qui est au sud de 30°N », vu de (0°, 10°N) :
     la partie visible est bordée par plus de 180° d'horizon, qui passe par le
     bas du disque. L'arc le plus court passerait par le haut et peindrait
     l'Arctique à la place. L'orientation de l'anneau (aire signée en degrés)
     dit de quel côté tourner. */
  it('tourne l’arc d’horizon du bon côté quand il dépasse 180°', () => {
    const south = [...parallel(30, -180, 180), [180, 0], [180, -90], [-180, -90], [-180, 0]] as [
      number,
      number,
    ][];
    const ring = clipRing(flat(south), createRotation(0, 10)) ?? [];
    expect(ring.length).toBeGreaterThan(0);
    const all = points(ring);
    /* Le bas du disque (y = +1) est dans l'arc ; le haut (y = −1) n'y est pas. */
    expect(all.some(([x, y]) => Math.abs(x) < 0.05 && y > 0.99)).toBe(true);
    expect(all.some(([, y]) => y < -0.9)).toBe(false);
    /* Plus de la moitié du disque est couverte. */
    expect(Math.abs(area(ring))).toBeGreaterThan(Math.PI / 2);

    /* Le même anneau parcouru à l'envers couvre la même surface. */
    const reversed = clipRing(flat([...south].reverse()), createRotation(0, 10)) ?? [];
    expect(Math.abs(area(reversed))).toBeCloseTo(Math.abs(area(ring)), 6);
  });
});

describe('clipLine', () => {
  const facing = createRotation(0, 0);

  it('garde une ligne visible d’un seul morceau', () => {
    expect(clipLine(flat(parallel(0, -40, 40, 10)), facing)).toHaveLength(1);
  });

  it('s’arrête sur l’horizon', () => {
    const pieces = clipLine(flat(parallel(0, 60, 120, 10)), facing);
    expect(pieces).toHaveLength(1);
    const piece = pieces[0];
    expect(Math.hypot(piece[piece.length - 2], piece[piece.length - 1])).toBeCloseTo(1, 9);
  });

  it('rend deux morceaux pour une ligne qui passe derrière puis revient', () => {
    const line = [...parallel(10, 60, 120, 10), ...parallel(-10, 120, 60, -10)];
    expect(clipLine(flat(line), facing)).toHaveLength(2);
  });

  it('ne rend rien pour une ligne cachée', () => {
    expect(clipLine(flat(parallel(0, 120, 170, 10)), facing)).toEqual([]);
  });
});
