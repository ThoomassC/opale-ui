import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';

import type { UseSvgMapViewportResult } from './useSvgMapViewport';
import type { Point } from './viewport';

/**
 * Qui a le droit de zoomer à la molette.
 *
 * - `'modifier'` (défaut) : Ctrl ou ⌘ enfoncé. Le pincement d'un pavé tactile
 *   arrive aussi avec Ctrl, il fonctionne donc sans rien apprendre.
 * - `'always'` : toute molette zoome — à réserver à une carte plein écran.
 * - `false` : jamais.
 */
export type SvgMapWheel = 'modifier' | 'always' | false;

export interface SvgMapGestureOptions {
  readonly tapTolerance: number;
  readonly wheel: SvgMapWheel;
}

const HINT_MS = 1600;

/* =============================================================================
   LES GESTES DE LA CARTE.

   LA MOLETTE NE CONFISQUE PAS LE DÉFILEMENT DE LA PAGE. Une carte qui zoome à
   la moindre molette piège quiconque fait défiler l'article qui la contient :
   la page s'arrête net dès que le pointeur passe dessus. Par défaut, il faut
   donc Ctrl ou ⌘ — et une molette nue fait apparaître la consigne au lieu de
   ne rien faire en silence.

   UN CONTACT QUI BOUGE N'EST PLUS UN CLIC. Un glissement se termine toujours
   sur une région : sans seuil, se déplacer vaudrait sélection. Au-delà de
   `tapTolerance` pixels, le contact devient un déplacement et le clic qui suit
   est avalé ; en dessous, il compte — un doigt n'est jamais immobile.

   PAS DE CAPTURE DU POINTEUR. `setPointerCapture` redirigerait le `click`
   vers le `<svg>` : la région sous le doigt ne le recevrait plus. Les
   déplacements sont donc suivis sur la fenêtre, le temps du geste.
   ========================================================================== */
export function useSvgMapGestures(
  svgRef: RefObject<SVGSVGElement | null>,
  viewport: UseSvgMapViewportResult,
  { tapTolerance, wheel }: SvgMapGestureOptions,
) {
  const pointers = useRef(new Map<number, Point>());
  const origin = useRef<Point | null>(null);
  const moved = useRef(false);
  const swallowClick = useRef(false);
  const viewportRef = useRef(viewport);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Les écouteurs de fenêtre d'un geste en cours, et de quoi les retirer. */
  const detachRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  /** Un point de l'écran, dans les coordonnées du dessin. */
  const toSvg = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const view = viewportRef.current.getView();
      return {
        x: view.x + ((clientX - rect.left) / rect.width) * view.width,
        y: view.y + ((clientY - rect.top) / rect.height) * view.height,
      };
    },
    [svgRef],
  );

  const handleMove = useCallback(
    (event: globalThis.PointerEvent) => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;
      const current = { x: event.clientX, y: event.clientY };

      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.entries()]
          .map(([id, point]) => (id === event.pointerId ? current : point))
          .slice(0, 2);
        const [pa, pb] = [...pointers.current.values()].slice(0, 2);
        const before = Math.hypot(pa.x - pb.x, pa.y - pb.y);
        const after = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
        pointers.current.set(event.pointerId, current);
        if (before > 0 && mid) viewportRef.current.zoomBy(after / before, mid);
        moved.current = true;
        return;
      }

      pointers.current.set(event.pointerId, current);
      const start = origin.current;
      if (!moved.current && start) {
        moved.current = Math.hypot(current.x - start.x, current.y - start.y) > tapTolerance;
        if (moved.current) setDragging(true);
      }
      if (!moved.current) return;

      const svg = svgRef.current;
      const rect = svg?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const view = viewportRef.current.getView();
      const scale = view.width / rect.width;
      viewportRef.current.panBy(
        -(current.x - previous.x) * scale,
        -(current.y - previous.y) * scale,
      );
    },
    [svgRef, tapTolerance, toSvg],
  );

  /** Vrai quand le dernier contact se lève : le geste est fini. */
  const handleUp = useCallback((event: globalThis.PointerEvent): boolean => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size > 0) return false;

    setDragging(false);
    if (moved.current) {
      /* Le `click` part juste après `pointerup`, dans la même tâche : le
           drapeau est levé pour lui seul, puis retombe. */
      swallowClick.current = true;
      setTimeout(() => {
        swallowClick.current = false;
      }, 0);
    }
    origin.current = null;
    moved.current = false;
    return true;
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (pointers.current.size === 0) {
        origin.current = { x: event.clientX, y: event.clientY };
        moved.current = false;
        const move = (next: globalThis.PointerEvent) => handleMove(next);
        const up = (next: globalThis.PointerEvent) => {
          if (handleUp(next)) detachRef.current();
        };
        detachRef.current = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          detachRef.current = () => undefined;
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      }
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    },
    [handleMove, handleUp],
  );

  const onClickCapture = useCallback(
    (event: { stopPropagation(): void; preventDefault(): void }) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.stopPropagation();
      event.preventDefault();
    },
    [],
  );

  useEffect(
    () => () => {
      detachRef.current();
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  /* LA MOLETTE S'ÉCOUTE EN NATIF, NON PASSIVE. React branche `onWheel` en
     écouteur passif : `preventDefault` y est ignoré, et la page défilerait
     pendant qu'on zoome. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || wheel === false) return undefined;

    const onWheel = (event: WheelEvent) => {
      const modified = event.ctrlKey || event.metaKey;
      if (wheel === 'modifier' && !modified) {
        setHint(true);
        if (hintTimer.current) clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => setHint(false), HINT_MS);
        return;
      }
      event.preventDefault();
      setHint(false);
      const point = toSvg(event.clientX, event.clientY);
      /* Un pincement de pavé tactile envoie des deltas fins avec Ctrl ; une
         molette, des crans larges. Deux sensibilités pour un même ressenti. */
      const sensitivity = event.ctrlKey && Math.abs(event.deltaY) < 20 ? 0.01 : 0.0025;
      viewportRef.current.zoomBy(Math.exp(-event.deltaY * sensitivity), point ?? undefined);
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgRef, toSvg, wheel]);

  return { onPointerDown, onClickCapture, dragging, hint };
}
