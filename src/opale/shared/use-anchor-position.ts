import { useLayoutEffect, type RefObject } from 'react';

import { computeAnchorPosition, type AnchorAlign, type AnchorSide } from './anchor-position';

/* =============================================================================
   POSER UNE SURFACE CONTRE SON ANCRE, ET L'Y TENIR. Interne : non réexporté.

   LA POSITION EST ÉCRITE DANS LE DOM, PAS DANS UN ÉTAT. Elle dépend de deux
   mesures — l'ancre et la surface — qui n'existent qu'après la mise en page :
   un état la ferait arriver un rendu trop tard, donc une image au coin haut
   gauche, et `react-hooks/set-state-in-effect` le signalerait à juste titre.
   L'effet de mise en page écrit `top`, `left` et `data-side` avant la
   première peinture ; c'est une synchronisation avec un système extérieur,
   la mise en page du navigateur, et elle se défait au nettoyage.

   ELLE SUIT : le défilement (de n'importe quel ancêtre, d'où l'écoute en
   capture), le redimensionnement de la fenêtre, et celui de l'ancre ou de la
   surface quand `ResizeObserver` existe.
   ========================================================================== */

export interface AnchorPositionOptions {
  readonly enabled: boolean;
  readonly side: AnchorSide;
  readonly align: AnchorAlign;
  readonly offset: number;
  /** La distance minimale au bord de la fenêtre. Défaut : 8 px. */
  readonly margin?: number;
}

function viewportSize() {
  const root = document.documentElement;
  return {
    width: root.clientWidth || window.innerWidth,
    height: root.clientHeight || window.innerHeight,
  };
}

/** Tient `floating` contre `anchor` tant que `enabled` est vrai. */
export function useAnchorPosition(
  floatingRef: RefObject<HTMLElement | null>,
  anchor: HTMLElement | null,
  { enabled, side, align, offset, margin = 8 }: AnchorPositionOptions,
): void {
  useLayoutEffect(() => {
    const floating = floatingRef.current;
    if (!enabled || !floating || !anchor) return undefined;

    const update = () => {
      const box = anchor.getBoundingClientRect();
      const position = computeAnchorPosition({
        anchor: { top: box.top, left: box.left, width: box.width, height: box.height },
        floating: { width: floating.offsetWidth, height: floating.offsetHeight },
        viewport: viewportSize(),
        side,
        align,
        offset,
        margin,
      });
      floating.style.top = `${position.top}px`;
      floating.style.left = `${position.left}px`;
      floating.dataset.side = position.side;
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(anchor);
    observer?.observe(floating);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      observer?.disconnect();
    };
  }, [align, anchor, enabled, floatingRef, margin, offset, side]);
}
