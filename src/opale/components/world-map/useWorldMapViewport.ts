import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { SvgMapGestureTarget } from '../svg-map/useSvgMapGestures';
import type { SvgMapMoveOptions } from '../svg-map/useSvgMapViewport';
import type { Point } from '../svg-map/viewport';
import {
  clampView,
  frameOf,
  GLOBE_MAX_ZOOM,
  lerpView,
  panByPixels,
  rotateByPixels,
  zoomAround,
  type Frame,
  type ViewBounds,
  type WorldMapMode,
  type WorldMapView,
} from './view';

export type { WorldMapView } from './view';

export interface WorldMapMoveOptions {
  /** Anime la transition. Sans effet si l'utilisateur a demandé moins d'animation. */
  readonly animate?: boolean;
}

export interface WorldMapViewportOptions {
  /** La vue de départ, et celle où ramène `reset`. */
  readonly initialView?: WorldMapView;
  /** Le zoom maximal du plan, en puissances de deux. Le globe s'arrête à 3. */
  readonly maxZoom?: number;
  /**
   * Appelée quand la vue se POSE : à l'arrivée d'une animation, ou 150 ms
   * après le dernier mouvement d'un geste — jamais à chaque image.
   */
  readonly onViewChange?: (view: WorldMapView) => void;
}

export interface UseWorldMapViewportResult {
  /** La vue peinte. */
  readonly view: WorldMapView;
  /** La vue VISÉE : l'arrivée de la transition en cours, `view` hors transition. */
  readonly target: WorldMapView;
  /** Vrai tant que le zoom maximal du mode courant n'est pas atteint. */
  readonly canZoomIn: boolean;
  /** Vrai dès que la vue visée est plus serrée que la vue d'ensemble. */
  readonly zoomed: boolean;
  /** Va à une vue ; ce qui n'est pas précisé est gardé. Animé par défaut. */
  flyTo(view: Partial<WorldMapView>, options?: WorldMapMoveOptions): void;
  /** Zoome d'un facteur, au centre. Un facteur supérieur à 1 rapproche. */
  zoomBy(factor: number, options?: WorldMapMoveOptions): void;
  /** Revient à la vue initiale. Animé par défaut. */
  reset(options?: WorldMapMoveOptions): void;
  /** La vue à l'instant, sans attendre le prochain rendu. */
  getView(): WorldMapView;

  /* --- Branchements internes de `WorldMap` : hors du contrat public. --- */

  /** Le zoom maximal du mode courant. */
  readonly maxZoom: number;
  /** Vrai pendant un mouvement (geste ou animation), jusqu'à ce que la vue se pose. */
  readonly moving: boolean;
  /** Le mode de rendu enregistré par la carte. */
  readonly mode: WorldMapMode;
  /**
   * La façade que `useSvgMapGestures` pilote, en unités du cadre : en plan,
   * glisser déplace ; sur le globe, glisser fait tourner.
   */
  readonly gestureTarget: SvgMapGestureTarget;
  /** La carte y dépose son mode et son cadre ; la vue est rebornée au besoin. */
  registerFrame(mode: WorldMapMode, frame: Frame): void;
}

/** La vue d'ensemble par défaut : le monde entier, un peu au nord de l'équateur. */
export const DEFAULT_WORLD_MAP_VIEW: WorldMapView = { longitude: 0, latitude: 20, zoom: 0 };
/** Le temps sans mouvement au bout duquel la vue est posée. */
export const SETTLE_MS = 150;

const DURATION_MS = 280;
const DEFAULT_MAX_ZOOM = 8;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Le système demande-t-il moins d'animation ? Lu au moment du mouvement, jamais au rendu. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

interface ViewportState {
  readonly view: WorldMapView;
  readonly target: WorldMapView;
  readonly bounds: ViewBounds;
  readonly moving: boolean;
}

/**
 * La vue d'une `WorldMap`, qu'on crée soi-même pour la piloter de
 * l'extérieur : voler vers une ville, revenir à la vue d'ensemble, lire le
 * centre et le zoom. Passée à `<WorldMap viewport={…}>`, elle est PARTAGÉE.
 *
 * Rien n'est lu de `window` au rendu : le crochet se rend tel quel sur le
 * serveur.
 */
export function useWorldMapViewport({
  initialView = DEFAULT_WORLD_MAP_VIEW,
  maxZoom = DEFAULT_MAX_ZOOM,
  onViewChange,
}: WorldMapViewportOptions = {}): UseWorldMapViewportResult {
  const [state, setState] = useState<ViewportState>(() => {
    const bounds: ViewBounds = { mode: 'flat', frame: frameOf(16 / 9), maxZoom };
    const view = clampView(initialView, bounds);
    return { view, target: view, bounds, moving: false };
  });

  /* LE ZOOM MAXIMAL SUIT LA PROP, PENDANT LE RENDU : c'est un état dérivé, la
     vue est rebornée sans attendre un effet. */
  let current = state;
  if (state.bounds.maxZoom !== maxZoom) {
    const bounds = { ...state.bounds, maxZoom };
    current = {
      ...state,
      bounds,
      view: clampView(state.view, bounds),
      target: clampView(state.target, bounds),
    };
    setState(current);
  }
  const { view, target, bounds, moving } = current;

  const viewRef = useRef(view);
  const targetRef = useRef(target);
  const boundsRef = useRef(bounds);
  const frameRef = useRef<number | null>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef({ initialView, onViewChange });

  useLayoutEffect(() => {
    optionsRef.current = { initialView, onViewChange };
  });
  useLayoutEffect(() => {
    viewRef.current = view;
    targetRef.current = target;
    boundsRef.current = bounds;
  }, [view, target, bounds]);

  const cancelAnimation = useCallback(() => {
    if (frameRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = null;
  }, []);

  /* LA VUE SE POSE 150 MS APRÈS LE DERNIER MOUVEMENT. Chaque mouvement réarme
     le minuteur ; une animation ne l'arme qu'à son arrivée. */
  const armSettle = useCallback(() => {
    if (settleRef.current !== null) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      settleRef.current = null;
      setState((previous) => ({ ...previous, moving: false }));
      optionsRef.current.onViewChange?.(viewRef.current);
    }, SETTLE_MS);
  }, []);

  useEffect(
    () => () => {
      if (settleRef.current !== null) clearTimeout(settleRef.current);
      settleRef.current = null;
      cancelAnimation();
    },
    [cancelAnimation],
  );

  /* `arrival` est la vue visée : la même que `next` pour un mouvement
     immédiat, l'arrivée de la transition pour une image d'animation. */
  const commit = useCallback(
    (next: WorldMapView, arrival: WorldMapView = next, animating = false) => {
      viewRef.current = next;
      targetRef.current = arrival;
      setState((previous) => ({ ...previous, view: next, target: arrival, moving: true }));
      if (!animating) armSettle();
    },
    [armSettle],
  );

  const moveTo = useCallback(
    (destination: WorldMapView, animate: boolean) => {
      cancelAnimation();
      const from = viewRef.current;
      if (!animate || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
        commit(destination);
        return;
      }
      /* La destination est connue dès le départ : publiée tout de suite. */
      commit(from, destination, true);
      const start = performance.now();
      const mode = boundsRef.current.mode;
      /* La progression est bornée des deux côtés : l'horodatage d'une image
         peut précéder le départ (voir `useSvgMapViewport`). */
      const step = () => {
        const t = Math.min(1, Math.max(0, (performance.now() - start) / DURATION_MS));
        if (t < 1) {
          commit(lerpView(from, destination, easeOutCubic(t), mode), destination, true);
          frameRef.current = requestAnimationFrame(step);
        } else {
          frameRef.current = null;
          commit(destination);
        }
      };
      frameRef.current = requestAnimationFrame(step);
    },
    [cancelAnimation, commit],
  );

  /** La vue d'où part un nouveau mouvement : l'arrivée d'une transition en cours. */
  const departure = useCallback(
    () => (frameRef.current !== null ? targetRef.current : viewRef.current),
    [],
  );

  const flyTo = useCallback(
    (next: Partial<WorldMapView>, { animate = true }: WorldMapMoveOptions = {}) => {
      moveTo(clampView({ ...departure(), ...next }, boundsRef.current), animate);
    },
    [departure, moveTo],
  );

  const zoomAt = useCallback(
    (factor: number, origin: Point | undefined, animate: boolean) => {
      const b = boundsRef.current;
      const point: [number, number] = origin
        ? [origin.x, origin.y]
        : [b.frame.width / 2, b.frame.height / 2];
      moveTo(zoomAround(departure(), factor, point, b), animate);
    },
    [departure, moveTo],
  );

  const zoomBy = useCallback(
    (factor: number, { animate = false }: WorldMapMoveOptions = {}) =>
      zoomAt(factor, undefined, animate),
    [zoomAt],
  );

  const reset = useCallback(
    ({ animate = true }: WorldMapMoveOptions = {}) =>
      moveTo(clampView(optionsRef.current.initialView, boundsRef.current), animate),
    [moveTo],
  );

  const getView = useCallback(() => viewRef.current, []);

  /* LES GESTES PARLENT EN UNITÉS DU CADRE, et la vue qu'ils lisent est le
     cadre lui-même : le dessin bouge par la transformation de son `<g>`, le
     `viewBox` ne change pas. Un déplacement achève d'un coup la transition
     en cours, puis part de son arrivée. */
  const gestureTarget = useMemo<SvgMapGestureTarget>(
    () => ({
      getView: () => ({
        x: 0,
        y: 0,
        width: boundsRef.current.frame.width,
        height: boundsRef.current.frame.height,
      }),
      panBy: (dx: number, dy: number) => {
        const from = departure();
        cancelAnimation();
        const b = boundsRef.current;
        /* Les gestes déplacent la VUE (−pointeur) ; le globe tourne avec le
           pointeur : Δλ = −(pointeur) / R. */
        commit(
          b.mode === 'flat' ? panByPixels(from, dx, dy, b) : rotateByPixels(from, -dx, -dy, b),
        );
      },
      zoomBy: (factor: number, origin?: Point, options?: SvgMapMoveOptions) =>
        zoomAt(factor, origin, options?.animate ?? false),
    }),
    [cancelAnimation, commit, departure, zoomAt],
  );

  const registerFrame = useCallback(
    (mode: WorldMapMode, frame: Frame) => {
      const previous = boundsRef.current;
      if (
        previous.mode === mode &&
        previous.frame.width === frame.width &&
        previous.frame.height === frame.height
      ) {
        return;
      }
      const next: ViewBounds = { ...previous, mode, frame };
      boundsRef.current = next;
      cancelAnimation();
      const clamped = clampView(departure(), next);
      setState((state) => ({ ...state, bounds: next }));
      const before = viewRef.current;
      if (
        clamped.longitude !== before.longitude ||
        clamped.latitude !== before.latitude ||
        clamped.zoom !== before.zoom
      ) {
        commit(clamped);
      } else if (targetRef.current !== before) {
        commit(before);
      }
    },
    [cancelAnimation, commit, departure],
  );

  const effectiveMax = bounds.mode === 'globe' ? Math.min(maxZoom, GLOBE_MAX_ZOOM) : maxZoom;

  return useMemo(
    () => ({
      view,
      target,
      canZoomIn: target.zoom < effectiveMax - 1e-3,
      zoomed: target.zoom > 1e-3,
      flyTo,
      zoomBy,
      reset,
      getView,
      maxZoom: effectiveMax,
      moving,
      mode: bounds.mode,
      gestureTarget,
      registerFrame,
    }),
    [
      view,
      target,
      effectiveMax,
      flyTo,
      zoomBy,
      reset,
      getView,
      moving,
      bounds.mode,
      gestureTarget,
      registerFrame,
    ],
  );
}
