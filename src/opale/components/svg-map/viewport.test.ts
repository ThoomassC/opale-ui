import { describe, expect, it } from 'vitest';

import {
  clampView,
  fitBounds,
  formatViewBox,
  panView,
  parseViewBox,
  zoomAround,
  zoomOf,
} from './viewport';

const BASE = parseViewBox('0 0 400 200');

describe('géométrie de la vue', () => {
  it('lit et réécrit un viewBox', () => {
    expect(BASE).toEqual({ x: 0, y: 0, width: 400, height: 200 });
    expect(formatViewBox({ x: 1.5, y: 2, width: 100, height: 50 })).toBe('1.5 2 100 50');
    expect(() => parseViewBox('0 0 -1 10')).toThrow();
    expect(() => parseViewBox('abc')).toThrow();
  });

  it('borne le zoom entre la vue d’ensemble et le zoom maximal', () => {
    expect(clampView({ x: 0, y: 0, width: 800, height: 400 }, BASE, 4)).toEqual(BASE);
    expect(zoomOf(clampView({ x: 0, y: 0, width: 10, height: 5 }, BASE, 4), BASE)).toBe(4);
  });

  it('garde la vue dans le dessin', () => {
    expect(clampView({ x: 390, y: -20, width: 100, height: 50 }, BASE, 9)).toEqual({
      x: 300,
      y: 0,
      width: 100,
      height: 50,
    });
  });

  /* Le point sous le curseur ne bouge pas : c'est ce qui fait qu'on zoome
     « sur » quelque chose et pas au centre. */
  it('zoome autour d’un point qui reste immobile', () => {
    const view = zoomAround(BASE, BASE, 2, { x: 100, y: 50 }, 9);
    expect(view).toEqual({ x: 50, y: 25, width: 200, height: 100 });
    expect(zoomOf(view, BASE)).toBe(2);
  });

  it('dézoome sans jamais dépasser la vue d’ensemble', () => {
    const zoomed = zoomAround(BASE, BASE, 4, { x: 200, y: 100 }, 9);
    expect(zoomAround(zoomed, BASE, 0.1, { x: 200, y: 100 }, 9)).toEqual(BASE);
  });

  it('déplace une vue zoomée, et reste immobile en vue d’ensemble', () => {
    const zoomed = zoomAround(BASE, BASE, 2, { x: 200, y: 100 }, 9);
    expect(panView(zoomed, BASE, 30, -10, 9)).toEqual({ x: 130, y: 40, width: 200, height: 100 });
    expect(panView(BASE, BASE, 30, 30, 9)).toEqual(BASE);
  });

  /* Un ensemble plus haut que large doit tenir en hauteur : cadrer sur la
     seule largeur le couperait. */
  it('cadre un ensemble en gardant le rapport de la carte', () => {
    const view = fitBounds({ minX: 100, minY: 50, maxX: 120, maxY: 150 }, BASE, 9, 0);
    expect(view.height).toBeCloseTo(100);
    expect(view.width).toBeCloseTo(200);
    expect(view.x + view.width / 2).toBeCloseTo(110);
    expect(view.y + view.height / 2).toBeCloseTo(100);
  });

  it('reste centré sur un ensemble plus petit que le zoom maximal ne l’autorise', () => {
    const view = fitBounds({ minX: 199, minY: 99, maxX: 201, maxY: 101 }, BASE, 4, 0.1);
    expect(zoomOf(view, BASE)).toBe(4);
    expect(view.x + view.width / 2).toBeCloseTo(200);
    expect(view.y + view.height / 2).toBeCloseTo(100);
  });
});
