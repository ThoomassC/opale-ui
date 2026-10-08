import { describe, expect, it } from 'vitest';

import { isArrowKey, nearestInDirection } from './neighbour';

/* Une croix de cinq points, plus un point lointain mais bien aligné, et un
   point proche mais de biais : l'écart perpendiculaire pèse double. */
const CENTERS = new Map([
  ['center', { x: 0, y: 0 }],
  ['east', { x: 10, y: 0 }],
  ['west', { x: -10, y: 0 }],
  ['north', { x: 0, y: -10 }],
  ['south', { x: 0, y: 10 }],
  ['far-east', { x: 30, y: 0 }],
  ['east-slanted', { x: 6, y: 4 }],
]);

describe('nearestInDirection', () => {
  it('suit la géographie : chaque flèche vise le plus proche dans sa direction', () => {
    expect(nearestInDirection(CENTERS, 'center', 'ArrowRight')).toBe('east');
    expect(nearestInDirection(CENTERS, 'center', 'ArrowLeft')).toBe('west');
    expect(nearestInDirection(CENTERS, 'center', 'ArrowUp')).toBe('north');
    expect(nearestInDirection(CENTERS, 'center', 'ArrowDown')).toBe('south');
  });

  it('pèse double l’écart perpendiculaire', () => {
    /* east-slanted : 6 + 2 × 4 = 14 ; east : 10 + 0 = 10. */
    expect(nearestInDirection(CENTERS, 'center', 'ArrowRight')).toBe('east');
    /* Sans east : east-slanted (14) passe devant far-east (30). */
    const withoutEast = new Map(CENTERS);
    withoutEast.delete('east');
    expect(nearestInDirection(withoutEast, 'center', 'ArrowRight')).toBe('east-slanted');
  });

  it('ignore les candidats à moins d’un demi-point dans la direction', () => {
    const centers = new Map([
      ['a', { x: 0, y: 0 }],
      ['b', { x: 0.5, y: 0 }],
      ['c', { x: 0.51, y: 3 }],
    ]);
    expect(nearestInDirection(centers, 'a', 'ArrowRight')).toBe('c');
  });

  it('rend null sans voisin dans la direction, ou pour un point inconnu', () => {
    expect(nearestInDirection(CENTERS, 'far-east', 'ArrowRight')).toBeNull();
    expect(nearestInDirection(CENTERS, 'missing', 'ArrowLeft')).toBeNull();
    expect(nearestInDirection(new Map([['only', { x: 0, y: 0 }]]), 'only', 'ArrowUp')).toBeNull();
  });

  it('reconnaît les quatre flèches et rien d’autre', () => {
    expect(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].every(isArrowKey)).toBe(true);
    expect(isArrowKey('Arrow')).toBe(false);
    expect(isArrowKey('Home')).toBe(false);
  });
});
