import { describe, expect, it } from 'vitest';

import { pathBounds, unionBounds } from './path-bounds';

describe('pathBounds', () => {
  it('borne un tracé absolu', () => {
    expect(pathBounds('M10 20 L30 5 L25 40 Z')).toEqual({ minX: 10, minY: 5, maxX: 30, maxY: 40 });
  });

  /* Les tracés de svg-maps sont écrits en commandes RELATIVES et en répétitions
     implicites : `m 1,2 3,4` enchaîne un déplacement puis une ligne. */
  it('suit les commandes relatives et les répétitions implicites', () => {
    expect(pathBounds('m 10,10 5,0 0,5 -10,0 z')).toEqual({
      minX: 5,
      minY: 10,
      maxX: 15,
      maxY: 15,
    });
  });

  it('lit les horizontales, les verticales et les nombres collés', () => {
    expect(pathBounds('M0-2h10v-3.5.5H-4')).toEqual({ minX: -4, minY: -5.5, maxX: 10, maxY: -2 });
  });

  it('englobe les points de contrôle des courbes', () => {
    expect(pathBounds('M0 0 C 10 -10 20 30 30 0')).toEqual({
      minX: 0,
      minY: -10,
      maxX: 30,
      maxY: 30,
    });
    expect(pathBounds('M0 0 q 5 10 10 0 t 10 0')).toEqual({
      minX: 0,
      minY: -10,
      maxX: 20,
      maxY: 10,
    });
  });

  it('borne un arc par ses extrémités élargies de ses rayons', () => {
    const bounds = pathBounds('M0 0 A 5 5 0 0 1 10 0');
    expect(bounds.minX).toBeLessThanOrEqual(0);
    expect(bounds.maxX).toBeGreaterThanOrEqual(10);
    expect(bounds.minY).toBeLessThanOrEqual(-5);
  });

  it('refuse un tracé vide plutôt que de rendre une boîte fausse', () => {
    expect(() => pathBounds('')).toThrow();
  });

  it('réunit plusieurs boîtes', () => {
    expect(
      unionBounds([
        { minX: 0, minY: 0, maxX: 2, maxY: 2 },
        { minX: -1, minY: 1, maxX: 1, maxY: 5 },
      ]),
    ).toEqual({ minX: -1, minY: 0, maxX: 2, maxY: 5 });
  });

  /* svgo écrit les drapeaux d'arc sans séparateur : « 0 011 1 » se lit
     rotation 0, grand arc 0, sens 1, puis 1 1. Lu comme le nombre 011, l'arc
     disparaissait et la lettre suivante devenait un nombre. */
  it('lit des drapeaux d’arc collés, comme les écrit svgo', () => {
    const bounds = pathBounds('M0 0 a1 1 0 011 1 L5 5');
    expect(bounds.maxX).toBe(5);
    expect(bounds.maxY).toBe(5);
    expect(Number.isFinite(bounds.minX)).toBe(true);
  });

  /* Un grand arc ou des rayons trop petits — que le navigateur agrandit — sortent
     de l'enveloppe des extrémités : la boîte doit rester large, jamais étroite. */
  it('ne rogne pas un grand arc ni un arc aux rayons agrandis', () => {
    expect(pathBounds('M0 0 A50 50 0 1 1 1 0').maxY).toBeGreaterThanOrEqual(100);
    expect(pathBounds('M0 0 A1 1 0 0 1 100 0').maxY).toBeGreaterThanOrEqual(50);
  });

  it('refuse un tracé tronqué plutôt que de rendre une boîte NaN', () => {
    expect(() => pathBounds('M0 0 L5 Z')).toThrow();
  });
});
