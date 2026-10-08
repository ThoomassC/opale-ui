import { describe, expect, it } from 'vitest';

import { MAX_LATITUDE } from './projection';
import {
  clampView,
  frameOf,
  GLOBE_MAX_ZOOM,
  globeRadius,
  lerpView,
  panByPixels,
  projectFlat,
  rotateByPixels,
  unprojectFlat,
  webZoom,
  zoomAround,
  type ViewBounds,
} from './view';

const frame = frameOf(16 / 9);
const flat: ViewBounds = { mode: 'flat', frame, maxZoom: 10 };
const globe: ViewBounds = { mode: 'globe', frame, maxZoom: 10 };

describe('frameOf', () => {
  it('pose un cadre de 1000 unités de large, à la proportion demandée', () => {
    expect(frame).toEqual({ width: 1000, height: 562.5 });
  });
});

describe('clampView — plan', () => {
  it('borne le zoom entre la vue d’ensemble et le zoom maximal', () => {
    expect(clampView({ longitude: 0, latitude: 0, zoom: -2 }, flat).zoom).toBe(0);
    expect(clampView({ longitude: 0, latitude: 0, zoom: 14 }, flat).zoom).toBe(10);
  });

  it('ne montre jamais au-delà des bords du monde — pas de répétition', () => {
    /* À zoom 0, le monde a exactement la largeur du cadre : centré sur 0°. */
    expect(clampView({ longitude: 120, latitude: 0, zoom: 0 }, flat).longitude).toBeCloseTo(0, 9);
    const top = clampView({ longitude: 0, latitude: 89, zoom: 0 }, flat);
    const [, northEdge] = unprojectFlat(500, 0, top, frame);
    expect(northEdge).toBeCloseTo(MAX_LATITUDE, 6);
    const east = clampView({ longitude: 179, latitude: 0, zoom: 2 }, flat);
    const [eastEdge] = unprojectFlat(1000, 281.25, east, frame);
    expect(eastEdge).toBeCloseTo(180, 6);
  });

  it('centre verticalement un monde plus bas que le cadre', () => {
    const tall = frameOf(1 / 2);
    expect(
      clampView({ longitude: 0, latitude: 40, zoom: 0 }, { ...flat, frame: tall }).latitude,
    ).toBeCloseTo(0, 9);
  });
});

describe('clampView — globe', () => {
  it('borne le zoom à 3, la latitude aux pôles et ramène la longitude', () => {
    expect(GLOBE_MAX_ZOOM).toBe(3);
    expect(clampView({ longitude: 200, latitude: 95, zoom: 5 }, globe)).toEqual({
      longitude: -160,
      latitude: 90,
      zoom: 3,
    });
  });
});

describe('zoomAround', () => {
  it('garde immobile le point sous le pointeur', () => {
    const view = { longitude: 10, latitude: 45, zoom: 3 };
    const point = [700, 200] as const;
    const before = unprojectFlat(point[0], point[1], view, frame);
    const after = zoomAround(view, 2, point, flat);
    expect(after.zoom).toBeCloseTo(4, 9);
    const moved = unprojectFlat(point[0], point[1], after, frame);
    expect(moved[0]).toBeCloseTo(before[0], 9);
    expect(moved[1]).toBeCloseTo(before[1], 9);
  });

  it('ne bouge plus au zoom maximal', () => {
    const view = { longitude: 10, latitude: 45, zoom: 10 };
    expect(zoomAround(view, 2, [700, 200], flat)).toEqual(view);
  });

  it('zoome au centre sur le globe, borné à 3', () => {
    const after = zoomAround({ longitude: 10, latitude: 45, zoom: 2.5 }, 4, [0, 0], globe);
    expect(after).toEqual({ longitude: 10, latitude: 45, zoom: 3 });
  });
});

describe('panByPixels', () => {
  it('déplace le centre de dx unités du cadre, divisées par l’échelle', () => {
    const view = { longitude: 0, latitude: 0, zoom: 1 };
    const [x0] = projectFlat(0, 0, view, frame);
    const moved = panByPixels(view, 100, 0, flat);
    /* À zoom 1, 100 unités du cadre valent 50 unités du monde, soit 18°. */
    expect(moved.longitude).toBeCloseTo(18, 9);
    expect(projectFlat(0, 0, moved, frame)[0]).toBeCloseTo(x0 - 100, 9);
  });
});

describe('rotateByPixels', () => {
  it('tourne de −dx/R en longitude et de dy/R en latitude', () => {
    const view = { longitude: 0, latitude: 0, zoom: 0 };
    const radius = globeRadius(frame, 0);
    const turned = rotateByPixels(view, (radius * Math.PI) / 2, 0, globe);
    expect(turned.longitude).toBeCloseTo(-90, 9);
    const tilted = rotateByPixels(view, 0, (radius * Math.PI) / 6, globe);
    expect(tilted.latitude).toBeCloseTo(30, 9);
  });

  it('ralentit quand le globe grossit', () => {
    const near = rotateByPixels({ longitude: 0, latitude: 0, zoom: 2 }, 100, 0, globe);
    const far = rotateByPixels({ longitude: 0, latitude: 0, zoom: 0 }, 100, 0, globe);
    expect(Math.abs(near.longitude)).toBeCloseTo(Math.abs(far.longitude) / 4, 9);
  });
});

describe('webZoom', () => {
  it('vaut log2(largeur en pixels × 2^zoom / 256)', () => {
    expect(webZoom(0, 256)).toBe(0);
    expect(webZoom(1, 1024)).toBe(3);
  });
});

describe('lerpView', () => {
  it('interpole, et passe par l’antiméridien sur le globe quand c’est plus court', () => {
    const a = { longitude: 170, latitude: 0, zoom: 0 };
    const b = { longitude: -170, latitude: 10, zoom: 2 };
    expect(lerpView(a, b, 0.5, 'globe')).toEqual({ longitude: -180, latitude: 5, zoom: 1 });
    expect(lerpView(a, b, 0.5, 'flat')).toEqual({ longitude: 0, latitude: 5, zoom: 1 });
  });
});
