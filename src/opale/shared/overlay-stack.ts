/* =============================================================================
   LA PILE DES SURIMPRESSIONS : INERTIE DE L'ARRIÈRE-PLAN ET VERROU DE
   DÉFILEMENT, PARTAGÉS. Interne : non réexporté.

   POURQUOI UN ÉTAT AU NIVEAU DU MODULE. Chaque modale mémorisait à SON
   ouverture l'état des frères de son conteneur et le `overflow` de `<body>`,
   puis le restaurait à SA fermeture. Deux surimpressions sœurs — un panneau
   latéral et la confirmation qu'il ouvre, rendus côte à côte — se lisaient
   donc l'une l'autre : la seconde mémorisait l'inertie posée par la première,
   et la restaurait en partant. Refermées dans le même gestionnaire, ou hors
   de l'ordre inverse de leur ouverture, elles laissaient la page inerte et
   figée jusqu'au rechargement (ROB-01). Ouvertes dans le même rendu, deux
   modales imbriquées se neutralisaient mutuellement (ROB-05).

   CE QUI REMPLACE CES SAUVEGARDES CROISÉES.

   — L'INERTIE EST RECALCULÉE, PAS EMPILÉE. À chaque inscription ou retrait,
     on détermine la surimpression du DESSUS — la plus profonde dans l'arbre
     React, à profondeur égale la dernière inscrite, la même règle que la pile
     d'Échap — et on neutralise les frères de SON conteneur, et seulement
     d'elle. Ce qui était neutralisé et ne doit plus l'être retrouve sa
     valeur ; ce qui reste neutralisé n'est pas touché. La valeur d'origine de
     chaque élément est lue une seule fois, à sa première neutralisation, et
     rendue quand plus personne ne le neutralise : l'ordre des fermetures n'a
     plus d'importance.

   — LE VERROU DE DÉFILEMENT EST COMPTÉ. Le premier verrou mémorise le style
     de `<body>`, le dernier le rend.

   CE QUI N'EST PAS GÉRÉ, ET POURQUOI. Un hôte qui modifie `inert` ou
   `aria-hidden` sur un élément PENDANT qu'une surimpression le neutralise
   verra sa valeur écrasée à la fermeture par celle d'avant l'ouverture. C'est
   le comportement d'avant cette pile, et l'observer demanderait un
   `MutationObserver` sur tout l'arrière-plan.
   ========================================================================== */

/** Un élément qui porte cet attribut échappe à l'inertie posée par une surimpression. */
export const OVERLAY_EXEMPT_ATTRIBUTE = 'data-opale-modal-exempt';

interface OverlayEntry {
  readonly container: HTMLElement;
  readonly depth: number;
  readonly panel: HTMLElement | null;
  /** L'élément auquel rendre le focus à la fermeture. Voir `adoptReturnFocus`. */
  returnFocus: Element | null;
}

/** Ce qu'une surimpression inscrite garde en main. */
export interface OverlayHandle {
  /** Retire la surimpression de la pile ; peut être appelée dans n'importe quel ordre. */
  readonly release: () => void;
  /** Mémorise l'élément actif comme cible de retour du focus. Voir `adoptReturnFocus`. */
  readonly captureReturnFocus: () => void;
  /** Rend le focus : à la cible mémorisée si elle est encore atteignable, sinon au dessus de la pile. */
  readonly restoreFocus: () => void;
}

const overlays: OverlayEntry[] = [];

/* Les éléments neutralisés, et leurs valeurs d'avant la première neutralisation. */
const neutralized = new Map<HTMLElement, { inert: string | null; hidden: string | null }>();

function topOverlay(): OverlayEntry | undefined {
  let top: OverlayEntry | undefined;
  for (const candidate of overlays) {
    if (!top || candidate.depth >= top.depth) top = candidate;
  }
  return top;
}

/* On remonte du conteneur jusqu'à `<body>` et, à chaque niveau, on retient les
   FRÈRES : neutraliser `<body>` entier neutraliserait aussi le dialogue.

   UNE RÉGION EXEMPTÉE RESTE VIVANTE. Un frère qui CONTIENT une région
   exemptée n'est pas neutralisé en bloc : on descend dans ses enfants, et
   seule la branche de la région est épargnée. */
function backgroundOf(container: HTMLElement): Set<HTMLElement> {
  const targets = new Set<HTMLElement>();

  const collect = (element: HTMLElement) => {
    if (element.hasAttribute(OVERLAY_EXEMPT_ATTRIBUTE)) return;
    if (element.querySelector(`[${OVERLAY_EXEMPT_ATTRIBUTE}]`)) {
      for (const child of element.children) {
        if (child instanceof HTMLElement) collect(child);
      }
      return;
    }
    targets.add(element);
  };

  let level: HTMLElement | null = container;
  while (level && level !== document.body && level.parentElement) {
    for (const sibling of level.parentElement.children) {
      if (sibling === level || !(sibling instanceof HTMLElement)) continue;
      collect(sibling);
    }
    level = level.parentElement;
  }

  return targets;
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/* Un conteneur déjà détaché — son portail vient d'être retiré dans le même
   commit — ne neutralise rien : il n'a plus de frères. */
function syncInertness() {
  const top = topOverlay();
  const next = top?.container.isConnected ? backgroundOf(top.container) : new Set<HTMLElement>();

  for (const [element, previous] of neutralized) {
    if (next.has(element)) continue;
    restoreAttribute(element, 'inert', previous.inert);
    restoreAttribute(element, 'aria-hidden', previous.hidden);
    neutralized.delete(element);
  }

  for (const element of next) {
    if (neutralized.has(element)) continue;
    neutralized.set(element, {
      inert: element.getAttribute('inert'),
      hidden: element.getAttribute('aria-hidden'),
    });
    element.setAttribute('inert', '');
    element.setAttribute('aria-hidden', 'true');
  }
}

/* Un élément reçoit le focus s'il est dans le document et hors de `inert`. */
const focusable = (element: Element | null): element is HTMLElement =>
  element instanceof HTMLElement && element.isConnected && !element.closest('[inert]');

/* LE FOCUS DE RETOUR, QUAND DEUX SURIMPRESSIONS S'OUVRENT DANS LE MÊME RENDU.

   Une modale et celle qu'elle contient passent leurs effets de l'enfant au
   parent. L'enfant mémorise donc le DÉCLENCHEUR et prend le focus ; le parent,
   recouvert, ne le prend pas et trouve comme élément actif… le panneau de
   l'enfant. Chacun rendait alors le focus au mauvais endroit : l'enfant au
   déclencheur, devenu inerte sous le parent — le focus tombait sur `<body>` —,
   puis le parent à un panneau détruit.

   Le parent reprend donc la cible de l'enfant, et l'enfant reçoit à la place
   le panneau du parent : fermer l'enfant ramène au parent, fermer le parent
   ramène au déclencheur, comme si les deux s'étaient ouverts l'un après
   l'autre. */
function adoptReturnFocus(entry: OverlayEntry, active: Element | null) {
  const above = overlays.find(
    (candidate) => candidate !== entry && active !== null && candidate.container.contains(active),
  );
  if (!above || !entry.panel?.closest('[inert]')) {
    entry.returnFocus = active;
    return;
  }
  entry.returnFocus = above.returnFocus;
  above.returnFocus = entry.panel;
}

/**
 * Inscrit une surimpression ouverte. Tant qu'elle est la plus haute de la
 * pile, tout ce qui n'est pas elle reçoit `inert` et `aria-hidden`.
 */
export function registerOverlay(
  container: HTMLElement,
  depth: number,
  panel: HTMLElement | null = null,
): OverlayHandle {
  const entry: OverlayEntry = { container, depth, panel, returnFocus: null };
  overlays.push(entry);
  syncInertness();

  let released = false;
  return {
    release: () => {
      if (released) return;
      released = true;
      const index = overlays.indexOf(entry);
      if (index !== -1) overlays.splice(index, 1);
      syncInertness();
    },
    captureReturnFocus: () => adoptReturnFocus(entry, document.activeElement),
    /* LA CIBLE MÉMORISÉE PEUT ÊTRE DEVENUE INATTEIGNABLE — détachée, ou sous
       l'inertie d'une surimpression restée ouverte. Le focus va alors au
       panneau du dessus de la pile plutôt que de tomber sur `<body>`. */
    restoreFocus: () => {
      const target = entry.returnFocus;
      if (focusable(target)) {
        target.focus({ preventScroll: true });
        return;
      }
      const fallback = topOverlay()?.panel ?? null;
      if (focusable(fallback)) fallback.focus({ preventScroll: true });
    },
  };
}

let scrollLocks = 0;
let bodyBeforeLock: { overflow: string; paddingInlineEnd: string } | null = null;

/* LA BARRE DE DÉFILEMENT EST COMPENSÉE (ROB-08). Sur un bureau à barres
   classiques, `overflow: hidden` la retire et la page gagne 15 à 17 px : tout
   le contenu sautait latéralement à chaque ouverture et à chaque fermeture.

   LA COMPENSATION EST MESURÉE, PAS SUPPOSÉE. `innerWidth - clientWidth` donne
   la largeur de la barre, pas ce que le verrou en retire : sous un
   `html { scrollbar-gutter: stable }` ou un `html { overflow-y: scroll }`
   d'hôte, la barre reste, et un retrait ajouté décalait la page de 15 px.
   On lit donc `clientWidth` avant et après le verrou, et seul le gain positif
   est compensé. `clientWidth` à zéro — pas de mise en page, jsdom — ne
   compense rien. */
function widthGainedByLock(before: number): number {
  const after = document.documentElement.clientWidth;
  if (before <= 0 || after <= 0) return 0;
  return Math.max(0, after - before);
}

/**
 * Verrouille le défilement de `<body>`. Le premier verrou mémorise son style,
 * le dernier le restitue. La fonction rendue libère ce verrou-ci, une fois.
 */
export function lockBodyScroll(): () => void {
  if (scrollLocks === 0) {
    const { style } = document.body;
    bodyBeforeLock = { overflow: style.overflow, paddingInlineEnd: style.paddingInlineEnd };
    const widthBefore = document.documentElement.clientWidth;
    style.overflow = 'hidden';
    const gap = widthGainedByLock(widthBefore);
    if (gap > 0) {
      /* La valeur calculée est toujours en pixels ; `parseFloat` couvre aussi
         le `0` sans unité que rendent certains moteurs. */
      const current = Number.parseFloat(window.getComputedStyle(document.body).paddingInlineEnd);
      style.paddingInlineEnd = `${(Number.isFinite(current) ? current : 0) + gap}px`;
    }
  }
  scrollLocks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    scrollLocks -= 1;
    if (scrollLocks > 0 || !bodyBeforeLock) return;
    const { style } = document.body;
    style.overflow = bodyBeforeLock.overflow;
    style.paddingInlineEnd = bodyBeforeLock.paddingInlineEnd;
    bodyBeforeLock = null;
  };
}
