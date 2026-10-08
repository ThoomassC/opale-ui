/* =============================================================================
   LA VUE DE `WorldMap` — sans React, sans DOM.

   Une vue est `{ longitude, latitude, zoom }` : le centre, et un zoom en
   puissances de deux. Elle se dessine dans un CADRE en unités du `viewBox` :
   1000 de large, `1000 / proportion` de haut (`frameOf`).

   - PLAN : le monde Mercator fait 1000 × 1000 unités du monde (`mercator`
     × 1000). Au zoom z, une unité du monde vaut 2^z unités du cadre : au
     zoom 0, le monde a exactement la largeur du cadre. Pas de répétition
     horizontale : la vue ne montre jamais au-delà des bords du monde.
   - GLOBE : un disque de rayon `globeRadius`, centré dans le cadre. Le zoom
     est borné à `GLOBE_MAX_ZOOM` ; au-delà, c'est au plan de prendre le
     relais (plus de détail, pas de 10m sur le globe).
   ========================================================================== */

import { inverseMercator, mercator, normalizeLongitude } from './projection';

export interface WorldMapView {
  readonly longitude: number;
  readonly latitude: number;
  readonly zoom: number;
}

export type WorldMapMode = 'flat' | 'globe';

/** Le cadre, en unités du `viewBox`. */
export interface Frame {
  readonly width: number;
  readonly height: number;
}

/** Ce qui borne une vue : le mode, le cadre et le zoom maximal. */
export interface ViewBounds {
  readonly mode: WorldMapMode;
  readonly frame: Frame;
  readonly maxZoom: number;
}

/** La largeur du monde Mercator, et celle du cadre, en unités. */
export const WORLD_SIZE = 1000;
/** Le zoom maximal du globe. */
export const GLOBE_MAX_ZOOM = 3;
/** Le rayon du globe au zoom 0, en fraction de la demi-largeur utile du cadre. */
const GLOBE_FILL = 0.9;

const DEG = 180 / Math.PI;

/** Le cadre d'une proportion largeur / hauteur. */
export function frameOf(ratio: number): Frame {
  return { width: WORLD_SIZE, height: WORLD_SIZE / ratio };
}

/** Le rayon du globe, en unités du cadre. */
export function globeRadius(frame: Frame, zoom: number): number {
  return (Math.min(frame.width, frame.height) / 2) * GLOBE_FILL * 2 ** zoom;
}

/** Un point géographique en unités du monde Mercator (0…1000, y vers le bas). */
export function worldPoint(longitude: number, latitude: number): [number, number] {
  const [x, y] = mercator(longitude, latitude);
  return [x * WORLD_SIZE, y * WORLD_SIZE];
}

/**
 * La transformation du monde vers le cadre, en plan :
 * `cadre = monde × scale + (x, y)`. C'est celle du `<g>` qui porte le dessin.
 */
export function flatTransform(
  view: WorldMapView,
  frame: Frame,
): { readonly scale: number; readonly x: number; readonly y: number } {
  const scale = 2 ** view.zoom;
  const [cx, cy] = worldPoint(view.longitude, view.latitude);
  return { scale, x: frame.width / 2 - cx * scale, y: frame.height / 2 - cy * scale };
}

/** Un point géographique dans le cadre, en plan. */
export function projectFlat(
  longitude: number,
  latitude: number,
  view: WorldMapView,
  frame: Frame,
): [number, number] {
  const { scale, x, y } = flatTransform(view, frame);
  const [wx, wy] = worldPoint(longitude, latitude);
  return [wx * scale + x, wy * scale + y];
}

/** Le point géographique sous un point du cadre, en plan. */
export function unprojectFlat(
  frameX: number,
  frameY: number,
  view: WorldMapView,
  frame: Frame,
): [number, number] {
  const { scale, x, y } = flatTransform(view, frame);
  return inverseMercator((frameX - x) / scale / WORLD_SIZE, (frameY - y) / scale / WORLD_SIZE);
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Ramène une vue dans ses bornes. En plan, le centre est contraint pour que
 * la fenêtre reste dans le monde (centrée quand le monde est plus petit
 * qu'elle) ; sur le globe, la latitude s'arrête aux pôles et la longitude
 * fait le tour.
 */
export function clampView(view: WorldMapView, { mode, frame, maxZoom }: ViewBounds): WorldMapView {
  if (mode === 'globe') {
    return {
      longitude: normalizeLongitude(view.longitude),
      latitude: clamp(view.latitude, -90, 90),
      zoom: clamp(view.zoom, 0, Math.min(maxZoom, GLOBE_MAX_ZOOM)),
    };
  }
  const zoom = clamp(view.zoom, 0, maxZoom);
  const scale = 2 ** zoom;
  const [cx, cy] = worldPoint(view.longitude, view.latitude);
  const halfWidth = frame.width / 2 / scale;
  const halfHeight = frame.height / 2 / scale;
  const center = (value: number, half: number) =>
    half * 2 >= WORLD_SIZE ? WORLD_SIZE / 2 : clamp(value, half, WORLD_SIZE - half);
  const [longitude, latitude] = inverseMercator(
    center(cx, halfWidth) / WORLD_SIZE,
    center(cy, halfHeight) / WORLD_SIZE,
  );
  return { longitude, latitude, zoom };
}

/**
 * Zoome d'un facteur. En plan, le point du cadre `point` reste immobile :
 * on zoome « sur » ce qu'il désigne. Sur le globe, le zoom se fait au centre.
 */
export function zoomAround(
  view: WorldMapView,
  factor: number,
  point: readonly [number, number],
  bounds: ViewBounds,
): WorldMapView {
  const zoom = clampView({ ...view, zoom: view.zoom + Math.log2(factor) }, bounds).zoom;
  if (zoom === view.zoom) return view;
  if (bounds.mode === 'globe') return { ...view, zoom };
  const [longitude, latitude] = unprojectFlat(point[0], point[1], view, bounds.frame);
  const [px, py] = worldPoint(longitude, latitude);
  const scale = 2 ** zoom;
  const centerX = px - (point[0] - bounds.frame.width / 2) / scale;
  const centerY = py - (point[1] - bounds.frame.height / 2) / scale;
  const [lon, lat] = inverseMercator(centerX / WORLD_SIZE, centerY / WORLD_SIZE);
  return clampView({ longitude: lon, latitude: lat, zoom }, bounds);
}

/**
 * Déplace la vue en plan de `(dx, dy)` unités du cadre — des pixels quand le
 * cadre est affiché à l'échelle 1. Le monde suit le pointeur : déplacer de
 * +dx amène à l'écran ce qui était à droite.
 */
export function panByPixels(
  view: WorldMapView,
  dx: number,
  dy: number,
  bounds: ViewBounds,
): WorldMapView {
  const scale = 2 ** view.zoom;
  const [cx, cy] = worldPoint(view.longitude, view.latitude);
  const [longitude, latitude] = inverseMercator(
    (cx + dx / scale) / WORLD_SIZE,
    (cy + dy / scale) / WORLD_SIZE,
  );
  return clampView({ longitude, latitude, zoom: view.zoom }, bounds);
}

/**
 * Tourne le globe de `(dx, dy)` unités du cadre : Δλ = −dx / R et
 * Δφ = dy / R (radians), R le rayon affiché. Un glisser vers la droite fait
 * venir l'ouest ; vers le bas, le nord.
 */
export function rotateByPixels(
  view: WorldMapView,
  dx: number,
  dy: number,
  bounds: ViewBounds,
): WorldMapView {
  const radius = globeRadius(bounds.frame, view.zoom);
  return clampView(
    {
      longitude: view.longitude - (dx / radius) * DEG,
      latitude: view.latitude + (dy / radius) * DEG,
      zoom: view.zoom,
    },
    bounds,
  );
}

/**
 * Le zoom « web » : celui des tuiles et des `min_zoom` de Natural Earth, pour
 * un cadre affiché sur `framePx` pixels de large.
 */
export function webZoom(zoom: number, framePx: number): number {
  return Math.log2((framePx * 2 ** zoom) / 256);
}

/**
 * L'interpolation de deux vues. Sur le globe, la longitude prend le chemin
 * le plus court, quitte à passer l'antiméridien ; en plan, le monde ne se
 * répète pas, elle va tout droit.
 */
export function lerpView(
  from: WorldMapView,
  to: WorldMapView,
  t: number,
  mode: WorldMapMode,
): WorldMapView {
  let delta = to.longitude - from.longitude;
  if (mode === 'globe') delta = normalizeLongitude(delta);
  const longitude = from.longitude + delta * t;
  return {
    longitude: mode === 'globe' ? normalizeLongitude(longitude) : longitude,
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    zoom: from.zoom + (to.zoom - from.zoom) * t,
  };
}
