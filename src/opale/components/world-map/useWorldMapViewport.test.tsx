import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { unprojectFlat, frameOf } from './view';
import {
  DEFAULT_WORLD_MAP_VIEW,
  SETTLE_MS,
  useWorldMapViewportState,
  type WorldMapViewportOptions,
} from './useWorldMapViewport';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/* =============================================================================
   LA VUE DE LA CARTE DU MONDE, PILOTÉE DE L'EXTÉRIEUR.

   Le cadre par défaut est 16 / 9 : 1000 × 562,5 unités. Les images et
   l'horloge sont simulées quand un mouvement est animé.
   ========================================================================== */

const fakeClock = () =>
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  });

const reduceMotion = () =>
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));

const setup = (options?: WorldMapViewportOptions) =>
  renderHook(() => useWorldMapViewportState(options)).result;

const PARIS = { longitude: 2.35, latitude: 48.85, zoom: 5 };

describe('useWorldMapViewport — la vue', () => {
  it('part de la vue initiale, bornée', () => {
    const result = setup();
    expect(result.current.view.longitude).toBeCloseTo(DEFAULT_WORLD_MAP_VIEW.longitude, 9);
    expect(result.current.view.latitude).toBeCloseTo(DEFAULT_WORLD_MAP_VIEW.latitude, 9);
    expect(result.current.view.zoom).toBe(0);
    expect(result.current.zoomed).toBe(false);
    expect(result.current.canZoomIn).toBe(true);
    const custom = setup({ initialView: { longitude: 0, latitude: 0, zoom: 40 }, maxZoom: 6 });
    expect(custom.current.view.zoom).toBe(6);
  });

  it('va à une vue sans animation', () => {
    const result = setup();
    act(() => result.current.flyTo(PARIS, { animate: false }));
    expect(result.current.view.longitude).toBeCloseTo(2.35, 9);
    expect(result.current.view.latitude).toBeCloseTo(48.85, 9);
    expect(result.current.view.zoom).toBe(5);
    expect(result.current.target).toEqual(result.current.view);
    expect(result.current.getView()).toEqual(result.current.view);
    expect(result.current.zoomed).toBe(true);
  });

  it('garde ce qu’on ne précise pas, et borne le zoom', () => {
    const result = setup({ maxZoom: 6 });
    act(() => result.current.flyTo(PARIS, { animate: false }));
    act(() => result.current.flyTo({ zoom: 20 }, { animate: false }));
    expect(result.current.view.longitude).toBeCloseTo(2.35, 9);
    expect(result.current.view.zoom).toBe(6);
    expect(result.current.canZoomIn).toBe(false);
  });

  it('anime en 280 ms : la destination est publiée tout de suite, la vue suit', () => {
    fakeClock();
    const result = setup();
    act(() => result.current.flyTo(PARIS));
    expect(result.current.target.zoom).toBe(5);
    expect(result.current.view.zoom).toBe(0);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const midway = result.current.view.zoom;
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(5);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.view.zoom).toBe(5);
  });

  it('saute à la vue quand le système demande moins d’animation', () => {
    fakeClock();
    reduceMotion();
    const result = setup();
    act(() => result.current.flyTo(PARIS));
    expect(result.current.view.zoom).toBe(5);
  });

  it('zoome d’un facteur au centre, et revient à la vue initiale', () => {
    const result = setup();
    act(() => result.current.flyTo(PARIS, { animate: false }));
    act(() => result.current.zoomBy(2, { animate: false }));
    expect(result.current.view.zoom).toBeCloseTo(6, 9);
    expect(result.current.view.longitude).toBeCloseTo(2.35, 9);
    act(() => result.current.reset({ animate: false }));
    expect(result.current.view.zoom).toBe(0);
    expect(result.current.zoomed).toBe(false);
  });
});

describe('useWorldMapViewport — au repos seulement', () => {
  it('prévient une fois le geste fini, pas pendant', () => {
    fakeClock();
    const onViewChange = vi.fn();
    const result = setup({ onViewChange });
    act(() => result.current.flyTo({ zoom: 3 }, { animate: false }));
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS);
    });
    onViewChange.mockClear();

    for (let i = 0; i < 5; i += 1) {
      act(() => result.current.gestureTarget.panBy(10, 0));
      expect(result.current.moving).toBe(true);
      act(() => {
        vi.advanceTimersByTime(SETTLE_MS / 3);
      });
    }
    expect(onViewChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS);
    });
    expect(onViewChange).toHaveBeenCalledTimes(1);
    expect(onViewChange).toHaveBeenCalledWith(result.current.view);
    expect(result.current.moving).toBe(false);
  });

  it('prévient à l’arrivée d’une animation, pas à chaque image', () => {
    fakeClock();
    const onViewChange = vi.fn();
    const result = setup({ onViewChange });
    act(() => result.current.flyTo(PARIS));
    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(onViewChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS + 50);
    });
    expect(onViewChange).toHaveBeenCalledTimes(1);
    expect(onViewChange.mock.calls[0][0]).toMatchObject({ zoom: 5 });
  });

  it('ne prévient plus après le démontage', () => {
    fakeClock();
    const onViewChange = vi.fn();
    const { result, unmount } = renderHook(() => useWorldMapViewportState({ onViewChange }));
    act(() => result.current.flyTo(PARIS, { animate: false }));
    unmount();
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS * 2);
    });
    expect(onViewChange).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('useWorldMapViewport — la façade des gestes', () => {
  it('rend le cadre comme vue des gestes', () => {
    const result = setup();
    expect(result.current.gestureTarget.getView()).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 562.5,
    });
    act(() => result.current.registerFrame('flat', frameOf(1)));
    expect(result.current.gestureTarget.getView()).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
    });
  });

  it('déplace le plan sous le pointeur, et zoome sur un point immobile', () => {
    const result = setup();
    act(() => result.current.flyTo(PARIS, { animate: false }));
    const frame = frameOf(16 / 9);
    const before = unprojectFlat(700, 200, result.current.view, frame);
    act(() => result.current.gestureTarget.zoomBy(2, { x: 700, y: 200 }));
    const after = unprojectFlat(700, 200, result.current.view, frame);
    expect(after[0]).toBeCloseTo(before[0], 9);
    expect(after[1]).toBeCloseTo(before[1], 9);
    const longitude = result.current.view.longitude;
    act(() => result.current.gestureTarget.panBy(-50, 0));
    expect(result.current.view.longitude).toBeLessThan(longitude);
  });

  it('tourne le globe : glisser vers la droite fait venir l’ouest', () => {
    const result = setup();
    act(() => result.current.registerFrame('globe', frameOf(16 / 9)));
    act(() => result.current.flyTo({ longitude: 10, latitude: 0, zoom: 1 }, { animate: false }));
    /* Les gestes déplacent la VUE : un pointeur qui va à droite donne −dx. */
    act(() => result.current.gestureTarget.panBy(-40, 0));
    expect(result.current.view.longitude).toBeLessThan(10);
    act(() => result.current.gestureTarget.panBy(0, -40));
    expect(result.current.view.latitude).toBeGreaterThan(0);
  });

  it('borne le globe au zoom 3, et garde le centre en changeant de mode', () => {
    const result = setup();
    act(() => result.current.flyTo(PARIS, { animate: false }));
    act(() => result.current.registerFrame('globe', frameOf(16 / 9)));
    expect(result.current.view.zoom).toBe(3);
    expect(result.current.view.longitude).toBeCloseTo(2.35, 9);
    expect(result.current.canZoomIn).toBe(false);
    act(() => result.current.registerFrame('flat', frameOf(16 / 9)));
    expect(result.current.canZoomIn).toBe(true);
  });
});
