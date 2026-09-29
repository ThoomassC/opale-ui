import { describe, expect, it } from 'vitest';

import {
  buildWorldPaths,
  compactPath,
  projectWorld,
  readTopology,
} from '../../../../../scripts/world-map.mjs';
import worldPaths from './world-paths.json';
import worldSource from './world.ts?raw';

/* =============================================================================
   LES TRACÉS PRÉCALCULÉS SONT LE MÊME DESSIN QUE LA PROJECTION.

   `world-paths.json` remplace la projection faite au chargement de la page.
   Il n'est acceptable que s'il dessine exactement ce qu'elle dessinait : même
   jeu 50m, mêmes points au dixième. Seuls disparaissent les segments de
   longueur nulle, qui ne peignent rien.
   ========================================================================== */

const TIMEOUT = 60_000;

type Point = readonly [number, number];

/** Les points absolus, en dixièmes entiers, de chaque sous-chemin. */
function absolutePoints(d: string): Point[][] {
  const rings: Point[][] = [];
  for (const [, command, body] of d.matchAll(/([ML])([^MLZ]*)/g)) {
    const [x, y] = body.split(',').map((value) => Math.round(Number(value) * 10));
    if (command === 'M') rings.push([[x, y]]);
    else rings[rings.length - 1].push([x, y]);
  }
  return rings;
}

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)/g;

function compactPoints(d: string): Point[][] {
  const rings: Point[][] = [];
  let x = 0;
  let y = 0;
  for (const [, command, body] of d.matchAll(/([Mlz])([^Mlz]*)/g)) {
    if (command === 'z') continue;
    const [a, b] = (body.match(NUMBER) ?? []).map((value) => Math.round(Number(value) * 10));
    if (command === 'M') {
      x = a;
      y = b;
      rings.push([[x, y]]);
    } else {
      x += a;
      y += b;
      rings[rings.length - 1].push([x, y]);
    }
  }
  return rings;
}

const withoutRepeats = (ring: readonly Point[]) =>
  ring.filter((point, index) => {
    const previous = ring[index - 1];
    return !previous || previous[0] !== point[0] || previous[1] !== point[1];
  });

describe('les tracés précalculés du monde', () => {
  it(
    'sont à jour du jeu 50m — relancez `node scripts/world-map.mjs` sinon',
    () => {
      expect(worldPaths).toEqual(buildWorldPaths(readTopology()));
    },
    TIMEOUT,
  );

  it(
    'passent par les mêmes points que la projection, au dixième',
    () => {
      const shapes = projectWorld(readTopology());
      expect(shapes).toHaveLength(worldPaths.length);
      const drifts = shapes.flatMap((shape, index) => {
        const expected = absolutePoints(shape.d).map(withoutRepeats);
        const actual = compactPoints(worldPaths[index].d);
        return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [shape.name];
      });
      expect(drifts).toEqual([]);
    },
    TIMEOUT,
  );

  it('écrit un déplacement relatif, sans séparateur inutile', () => {
    expect(compactPath('M10,20L10.5,19.9L10.5,19.9L12,21Z')).toBe('M10,20l.5-.1l1.5,1.1z');
  });

  it('ne projette plus rien au chargement de la page', () => {
    expect(worldSource).not.toMatch(/from '(?:world-atlas|topojson-client)/);
  });
});
