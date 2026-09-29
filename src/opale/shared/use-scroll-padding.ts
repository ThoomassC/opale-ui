import { useEffect, type RefObject } from 'react';

/* LA RÉSERVE DE DÉFILEMENT. Un en-tête collant, une bannière ou des toasts fixes
   recouvrent le bord de la fenêtre : `scroll-padding` sur `<html>` garde
   l'élément atteint au clavier hors de leur ombre. Chaque surface inscrit la
   place qu'elle occupe ; le bord reçoit la plus grande, et retrouve sa valeur
   d'origine quand plus personne n'y est inscrit. Interne : non réexporté. */

export type ScrollPaddingEdge = 'top' | 'bottom';

const PROPERTY = { top: 'scroll-padding-top', bottom: 'scroll-padding-bottom' } as const;

const reservations: Record<ScrollPaddingEdge, Map<object, number>> = {
  top: new Map(),
  bottom: new Map(),
};
const original: Partial<Record<ScrollPaddingEdge, string>> = {};

function apply(edge: ScrollPaddingEdge) {
  const { style } = document.documentElement;
  const sizes = [...reservations[edge].values()].filter((size) => size > 0);
  if (sizes.length === 0) {
    const previous = original[edge];
    if (previous === undefined) return;
    style.setProperty(PROPERTY[edge], previous);
    delete original[edge];
    return;
  }
  if (original[edge] === undefined) original[edge] = style.getPropertyValue(PROPERTY[edge]);
  style.setProperty(PROPERTY[edge], `${Math.ceil(Math.max(...sizes))}px`);
}

/** La place que l'élément occupe depuis le bord ; 0 s'il n'est pas peint. */
function occupied(element: HTMLElement, edge: ScrollPaddingEdge): number {
  const rect = element.getBoundingClientRect();
  if (rect.height <= 0) return 0;
  return Math.max(0, edge === 'top' ? rect.bottom : window.innerHeight - rect.top);
}

/** Réserve sur `edge` la place de l'élément, tant que `active` est vrai. */
export function useScrollPadding(
  ref: RefObject<HTMLElement | null>,
  edge: ScrollPaddingEdge | null,
  active = true,
) {
  useEffect(() => {
    const element = ref.current;
    if (!active || !edge || !element || typeof document === 'undefined') return undefined;

    const key = {};
    const measure = () => {
      reservations[edge].set(key, occupied(element, edge));
      apply(edge);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      reservations[edge].delete(key);
      apply(edge);
    };
  }, [active, edge, ref]);
}
