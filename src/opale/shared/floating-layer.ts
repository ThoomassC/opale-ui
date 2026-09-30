/* =============================================================================
   OÙ RENDRE UNE SURFACE ANCRÉE, ET CE QU'ELLE CONTIENT DE FOCALISABLE.
   Interne : non réexporté.

   LE PORTAIL SUIT LA COUCHE DE SON ANCRE. Rendu dans `<body>`, un popover
   ouvert depuis une modale était DOUBLEMENT perdu : `--opale-z-popover` (50)
   le posait sous `--opale-z-modal` (1000), et la pile des surimpressions
   (`overlay-stack.ts`) rend inertes tous les frères du conteneur de la
   modale — donc lui aussi. Quand l'ancre vit dans une surface qui déclare
   `aria-modal="true"`, la surface ancrée est rendue dans le conteneur de
   premier niveau de cette surface, l'enfant de `<body>` qui la porte : même
   plan d'empilement, même îlot hors de l'inertie. Ailleurs, `<body>`.
   ========================================================================== */

/** Le conteneur de portail d'une surface ancrée à `anchor`. */
export function floatingLayerOf(anchor: Element, body: HTMLElement): HTMLElement {
  const modal = anchor.closest('[aria-modal="true"]');
  if (!modal) return body;
  let layer: Element = modal;
  while (layer.parentElement && layer.parentElement !== body) layer = layer.parentElement;
  return layer.parentElement === body && layer instanceof HTMLElement ? layer : body;
}

/* La même liste que le piège de focus de `Modal`, et ses mêmes limites : ni
   visibilité ni `inert` filtrés, parce que `offsetParent` vaut toujours
   `null` sous jsdom. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(',');

/** Les éléments atteignables à la tabulation dans `root`, dans l'ordre du document. */
export function focusablesIn(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}
