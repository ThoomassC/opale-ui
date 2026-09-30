import type { FocusEvent, RefObject } from 'react';

/* =============================================================================
   RENDRE LE FOCUS QUAND UN MESSAGE SE FERME (ACC-10, WCAG 2.4.3).

   Un toast, un message unique ou le bandeau de cookies se retirent du DOM sous
   le focus : `document.activeElement` retombe sur `<body>`, et la tabulation
   suivante repart du haut de la page. Ces surfaces ne sont pas des dialogues —
   rien n'y a DÉPLACÉ le focus à leur ouverture —, donc il n'y a pas de
   déclencheur à retenir. Ce qu'on peut retenir, c'est l'élément D'OÙ VENAIT
   le focus quand il est entré : c'est là que l'utilisateur était.

   DEUX RÈGLES, ET ELLES SONT VOLONTAIREMENT ÉTROITES :

   - on ne rend le focus QUE s'il était dans ce qu'on ferme. Un message qui
     part pendant qu'on écrit ailleurs ne vole rien ;
   - on ne vise qu'un élément ENCORE DANS LE DOCUMENT et hors de ce qu'on
     ferme. Faute de quoi on ne fait rien : chercher « le prochain focalisable »
     devinerait une intention que rien ne dit.
   ========================================================================== */

/** Retient l'élément d'où le focus est entré dans le conteneur, s'il vient du dehors. */
export function rememberFocusOrigin(
  event: FocusEvent<HTMLElement>,
  origin: RefObject<HTMLElement | null>,
): void {
  const from = event.relatedTarget;
  if (from instanceof HTMLElement && !event.currentTarget.contains(from)) {
    origin.current = from;
  }
}

/** Vrai si le focus est dans `container`. */
export function holdsFocus(container: Element | null): boolean {
  const active = container?.ownerDocument.activeElement;
  return Boolean(container && active && container.contains(active));
}

/**
 * Rend le focus à `origin` si le focus est dans `container` et qu'`origin` est
 * encore dans le document, hors du conteneur. Vrai si le focus a été rendu.
 */
export function returnFocus(container: Element | null, origin: HTMLElement | null): boolean {
  if (!holdsFocus(container)) return false;
  return focusOrigin(container, origin);
}

/**
 * Pour un conteneur que React retire du DOM : à appeler depuis le nettoyage de
 * sa `ref`, qui passe AVANT le retrait. Si le focus y était, il est rendu à
 * `origin` une fois le retrait fait — et seulement si le nœud a bien quitté le
 * document : un simple changement de `ref` ne déplace rien.
 */
export function returnFocusAfterRemoval(
  container: HTMLElement,
  origin: RefObject<HTMLElement | null>,
): void {
  if (!holdsFocus(container)) return;
  const doc = container.ownerDocument;
  queueMicrotask(() => {
    if (container.isConnected) return;
    const active = doc.activeElement;
    if (active && active !== doc.body && active !== doc.documentElement) return;
    focusOrigin(container, origin.current);
  });
}

function focusOrigin(container: Element | null, origin: HTMLElement | null): boolean {
  if (!origin || !origin.isConnected || container?.contains(origin)) return false;
  origin.focus();
  return origin.ownerDocument.activeElement === origin;
}
