import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { unionBounds, type Bounds } from './path-bounds';
import {
  centerOn,
  clampView,
  contains,
  fitBounds,
  formatViewBox,
  lerpView,
  parseViewBox,
  zoomAround,
  zoomOf,
  type Point,
  type ViewRect,
} from './viewport';

export interface SvgMapViewportOptions {
  /** Zoom maximal, en facteur de la vue d'ensemble. */
  readonly maxZoom?: number;
}

export interface SvgMapMoveOptions {
  /** Anime la transition. Sans effet si l'utilisateur a demandé moins d'animation. */
  readonly animate?: boolean;
}

export interface SvgMapFitOptions extends SvgMapMoveOptions {
  /** Marge autour de l'ensemble, en fraction de sa taille. */
  readonly padding?: number;
}

export interface UseSvgMapViewportResult {
  /** La vue d'ensemble, telle que passée au crochet. */
  readonly viewBox: string;
  /** La vue courante, au format de l'attribut `viewBox`. */
  readonly current: string;
  readonly view: ViewRect;
  /** Facteur de zoom courant : 1 en vue d'ensemble. */
  readonly zoom: number;
  readonly maxZoom: number;
  /** Vrai dès que la vue est plus serrée que la vue d'ensemble. */
  readonly zoomed: boolean;
  /** Vrai tant que le zoom maximal n'est pas atteint. */
  readonly canZoomIn: boolean;
  /** Un facteur supérieur à 1 rapproche, inférieur éloigne. */
  zoomBy(factor: number, origin?: Point, options?: SvgMapMoveOptions): void;
  /** Déplace la vue, en unités du dessin. */
  panBy(dx: number, dy: number): void;
  /** Cadre sur un ensemble de régions, désignées par leur identifiant. */
  fitTo(ids: readonly string[], options?: SvgMapFitOptions): void;
  /** Recentre sur une région si elle sort de la vue, sans changer le zoom. */
  reveal(id: string, options?: SvgMapMoveOptions): void;
  /** Revient à la vue d'ensemble. */
  reset(options?: SvgMapMoveOptions): void;
  /**
   * La vue à l'instant, sans attendre le prochain rendu. Deux événements de
   * pincement arrivent dans la même image : le second doit voir le premier.
   */
  getView(): ViewRect;
  /**
   * Branchement interne : `SvgMap` y dépose la boîte de chacune de ses régions,
   * pour que `fitTo` et `reveal` sachent où elles sont.
   */
  readonly registerRegions: (bounds: ReadonlyMap<string, Bounds>) => void;
}

const DURATION_MS = 280;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Le système demande-t-il moins d'animation ? Sans `matchMedia`, on ne suppose rien. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * La vue d'une `SvgMap`, qu'on crée soi-même pour la piloter de l'extérieur :
 * cadrer sur un ensemble de régions, revenir à la vue d'ensemble, lire le zoom.
 *
 * Passée à `<SvgMap viewport={…}>` et à `<SvgMapControls viewport={…}>`, elle
 * est PARTAGÉE : la carte, ses commandes et l'appelant voient la même vue.
 */
export function useSvgMapViewport(
  viewBox: string,
  { maxZoom = 9 }: SvgMapViewportOptions = {},
): UseSvgMapViewportResult {
  const base = useMemo(() => parseViewBox(viewBox), [viewBox]);
  /* LA VUE EST RANGÉE AVEC LA VUE D'ENSEMBLE QUI L'A PRODUITE. Un autre dessin
     sous la même carte ne doit pas hériter d'un zoom calculé pour le
     précédent : quand `viewBox` change, la vue repart de la nouvelle vue
     d'ensemble, pendant le rendu même — c'est un état dérivé, pas un effet. */
  const [state, setState] = useState(() => ({ base, view: base }));
  let view = state.view;
  if (state.base !== base) {
    setState({ base, view: base });
    view = base;
  }
  const viewRef = useRef(view);
  const regionsRef = useRef<ReadonlyMap<string, Bounds>>(new Map());
  const frameRef = useRef<number | null>(null);

  const cancelAnimation = useCallback(() => {
    if (frameRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = null;
  }, []);

  const commit = useCallback((next: ViewRect) => {
    viewRef.current = next;
    setState((current) => ({ ...current, view: next }));
  }, []);

  /* La référence suit la vue rendue — y compris la remise à zéro ci-dessus,
     qui ne passe pas par `commit` — et une animation en cours pour l'ancien
     dessin s'arrête. */
  useLayoutEffect(() => {
    viewRef.current = state.view;
  }, [state.view]);
  /* AVANT LA PEINTURE, pas après : une image d'animation qui tomberait entre
     le rendu et un effet passif poserait une vue de l'ancien dessin sous la
     nouvelle vue d'ensemble. */
  useLayoutEffect(() => cancelAnimation, [base, cancelAnimation]);

  const moveTo = useCallback(
    (target: ViewRect, animate: boolean) => {
      cancelAnimation();
      const from = viewRef.current;

      if (!animate || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
        commit(target);
        return;
      }

      const start = performance.now();
      /* L'HORLOGE EST LUE ICI, ET LA PROGRESSION BORNÉE DES DEUX CÔTÉS.
         L'horodatage que passe `requestAnimationFrame` peut précéder le
         `performance.now()` du départ : la progression devenait négative,
         l'interpolation extrapolait, et la vue partait à l'infini. */
      const step = () => {
        const t = Math.min(1, Math.max(0, (performance.now() - start) / DURATION_MS));
        commit(t < 1 ? lerpView(from, target, easeOutCubic(t)) : target);
        frameRef.current = t < 1 ? requestAnimationFrame(step) : null;
      };
      frameRef.current = requestAnimationFrame(step);
    },
    [cancelAnimation, commit],
  );

  const zoomBy = useCallback(
    (factor: number, origin?: Point, { animate = false }: SvgMapMoveOptions = {}) => {
      const current = viewRef.current;
      const center = origin ?? {
        x: current.x + current.width / 2,
        y: current.y + current.height / 2,
      };
      moveTo(zoomAround(current, base, factor, center, maxZoom), animate);
    },
    [base, maxZoom, moveTo],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      cancelAnimation();
      const current = viewRef.current;
      commit(clampView({ ...current, x: current.x + dx, y: current.y + dy }, base, maxZoom));
    },
    [base, cancelAnimation, commit, maxZoom],
  );

  const fitTo = useCallback(
    (ids: readonly string[], { padding, animate = true }: SvgMapFitOptions = {}) => {
      const found = ids.flatMap((id) => {
        const bounds = regionsRef.current.get(id);
        return bounds ? [bounds] : [];
      });
      if (found.length === 0) return;
      moveTo(fitBounds(unionBounds(found), base, maxZoom, padding), animate);
    },
    [base, maxZoom, moveTo],
  );

  const reveal = useCallback(
    (id: string, { animate = true }: SvgMapMoveOptions = {}) => {
      const bounds = regionsRef.current.get(id);
      const current = viewRef.current;
      /* UNE MARGE, PARCE QUE LA VUE N'EST PAS TOUTE VISIBLE. La consigne et
         les commandes sont posées sur ses bords : une région « dans la vue »
         peut être entièrement dessous. */
      const margin = { x: current.width * 0.14, y: current.height * 0.14 };
      const inner = {
        x: current.x + margin.x,
        y: current.y + margin.y,
        width: current.width - 2 * margin.x,
        height: current.height - 2 * margin.y,
      };
      if (!bounds || contains(inner, bounds)) return;
      moveTo(centerOn(current, base, bounds, maxZoom), animate);
    },
    [base, maxZoom, moveTo],
  );

  const reset = useCallback(
    ({ animate = true }: SvgMapMoveOptions = {}) => moveTo(base, animate),
    [base, moveTo],
  );

  const getView = useCallback(() => viewRef.current, []);

  const registerRegions = useCallback((bounds: ReadonlyMap<string, Bounds>) => {
    regionsRef.current = bounds;
  }, []);

  const zoom = zoomOf(view, base);

  return useMemo(
    () => ({
      viewBox,
      current: formatViewBox(view),
      view,
      zoom,
      maxZoom,
      zoomed: zoom > 1.001,
      canZoomIn: zoom < maxZoom - 0.001,
      zoomBy,
      panBy,
      fitTo,
      reveal,
      reset,
      getView,
      registerRegions,
    }),
    [viewBox, view, zoom, maxZoom, zoomBy, panBy, fitTo, reveal, reset, getView, registerRegions],
  );
}
