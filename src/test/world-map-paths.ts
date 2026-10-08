/* Les données d'essai des tracés, partagées par les tests du plan et du globe. */

import type { WorldDataFile } from '../opale/components/world-map/data-format';

/** Les points absolus d'un tracé `M … l … z`. */
export function absolutePoints(d: string): [number, number][][] {
  const rings: [number, number][][] = [];
  let x = 0;
  let y = 0;
  for (const [, command, body] of d.matchAll(/([Mlz])([^Mlz]*)/g)) {
    if (command === 'z') continue;
    const numbers = (body.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      if (command === 'M' && i === 0) {
        x = numbers[0];
        y = numbers[1];
        rings.push([[x, y]]);
      } else {
        x += numbers[i];
        y += numbers[i + 1];
        rings[rings.length - 1].push([x, y]);
      }
    }
  }
  return rings;
}

/* Un carré de 1° autour de (2°E, 46°N), un lac, une côte, deux fleuves. */
export const FILE: WorldDataFile = {
  v: 1,
  q: [0, 40, 0.01],
  bbox: [0, 40, 10, 50],
  countries: [
    { id: 'FR', r: [[[200, 600, 100, 0, 0, 100, -100, 0]]] },
    { id: 'XX', r: [[[700, 900, 10, 0, 0, 10]]] },
  ],
  lakes: [[[250, 650, 10, 0, 0, 10]]],
  coast: [[200, 600, 50, 50, 50, -50]],
  borders: [[300, 600, 0, 100]],
  rivers: [
    { mz: 5, l: [210, 610, 10, 10] },
    { mz: 2, l: [220, 620, 10, 10] },
  ],
};
