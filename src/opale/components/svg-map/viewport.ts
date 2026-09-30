/* =============================================================================
   LA GÉOMÉTRIE DE LA VUE, EN FONCTIONS PURES.

   Une vue est un rectangle dans les coordonnées du dessin — exactement ce
   qu'écrit l'attribut `viewBox`. Zoomer la rétrécit, se déplacer la décale.
   Tout ce fichier ne manipule que des nombres : les gestes, les boutons et le
   cadrage passent par les mêmes fonctions, et un seul jeu de tests les tient.

   TROIS INVARIANTS, que `clampView` rétablit après chaque opération :
   1. la vue garde le RAPPORT de la vue d'ensemble — sans quoi le dessin se
      déformerait ou flotterait dans son cadre ;
   2. le zoom reste entre 1 (vue d'ensemble) et `maxZoom` ;
   3. la vue ne sort jamais du dessin : on ne se déplace pas dans le vide.
   ========================================================================== */

import type { Bounds } from './path-bounds';

export interface ViewRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export function parseViewBox(viewBox: string): ViewRect {
  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error(`viewBox invalide : « ${viewBox} » — quatre nombres attendus.`);
  }

  const [x, y, width, height] = parts;
  if (width <= 0 || height <= 0) {
    throw new Error(`viewBox invalide : « ${viewBox} » — largeur et hauteur positives.`);
  }

  return { x, y, width, height };
}

/* Quatre décimales : assez pour un zoom de ×9 sur un dessin de quelques
   centaines d'unités, et un attribut qui reste lisible dans l'inspecteur. */
const round = (value: number) => Math.round(value * 1e4) / 1e4;

export function formatViewBox(view: ViewRect): string {
  return [view.x, view.y, view.width, view.height].map(round).join(' ');
}

export function zoomOf(view: ViewRect, base: ViewRect): number {
  return round(base.width / view.width);
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function clampView(view: ViewRect, base: ViewRect, maxZoom: number): ViewRect {
  const width = clamp(view.width, base.width / Math.max(1, maxZoom), base.width);
  const height = (width * base.height) / base.width;

  return {
    x: clamp(view.x, base.x, base.x + base.width - width),
    y: clamp(view.y, base.y, base.y + base.height - height),
    width,
    height,
  };
}

/**
 * Zoome d'un facteur autour d'un point du dessin, qui reste immobile à l'écran.
 * Un facteur supérieur à 1 RAPPROCHE : c'est le sens d'une loupe, et celui
 * qu'on lit dans « ×2 ».
 */
export function zoomAround(
  view: ViewRect,
  base: ViewRect,
  factor: number,
  origin: Point,
  maxZoom: number,
): ViewRect {
  if (!(factor > 0)) return view;

  const width = clamp(view.width / factor, base.width / Math.max(1, maxZoom), base.width);
  const ratio = width / view.width;

  return clampView(
    {
      x: origin.x - (origin.x - view.x) * ratio,
      y: origin.y - (origin.y - view.y) * ratio,
      width,
      height: (width * base.height) / base.width,
    },
    base,
    maxZoom,
  );
}

export function panView(
  view: ViewRect,
  base: ViewRect,
  dx: number,
  dy: number,
  maxZoom: number,
): ViewRect {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy }, base, maxZoom);
}

/**
 * La vue qui cadre un ensemble, marge comprise.
 *
 * LE RAPPORT DE LA CARTE EST GARDÉ : on prend la plus grande des deux
 * contraintes, largeur de l'ensemble ou hauteur ramenée en largeur. Et le
 * CENTRE est posé après avoir borné le zoom, de sorte qu'un ensemble trop
 * petit pour le zoom maximal reste au milieu de la vue au lieu de glisser
 * dans un coin.
 */
export function fitBounds(
  bounds: Bounds,
  base: ViewRect,
  maxZoom: number,
  padding = 0.08,
): ViewRect {
  const aspect = base.width / base.height;
  const boundsWidth = (bounds.maxX - bounds.minX) * (1 + 2 * padding);
  const boundsHeight = (bounds.maxY - bounds.minY) * (1 + 2 * padding);
  const width = clamp(
    Math.max(boundsWidth, boundsHeight * aspect),
    base.width / Math.max(1, maxZoom),
    base.width,
  );
  const height = width / aspect;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return clampView(
    { x: centerX - width / 2, y: centerY - height / 2, width, height },
    base,
    maxZoom,
  );
}

/** La boîte est-elle entièrement dans la vue ? */
export function contains(view: ViewRect, bounds: Bounds): boolean {
  return (
    bounds.minX >= view.x &&
    bounds.minY >= view.y &&
    bounds.maxX <= view.x + view.width &&
    bounds.maxY <= view.y + view.height
  );
}

/** La même vue, recentrée sur une boîte : c'est ce que fait le clavier. */
export function centerOn(
  view: ViewRect,
  base: ViewRect,
  bounds: Bounds,
  maxZoom: number,
): ViewRect {
  return clampView(
    {
      ...view,
      x: (bounds.minX + bounds.maxX) / 2 - view.width / 2,
      y: (bounds.minY + bounds.maxY) / 2 - view.height / 2,
    },
    base,
    maxZoom,
  );
}

/** Interpolation entre deux vues, pour les transitions animées. */
export function lerpView(from: ViewRect, to: ViewRect, t: number): ViewRect {
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    width: mix(from.width, to.width),
    height: mix(from.height, to.height),
  };
}
