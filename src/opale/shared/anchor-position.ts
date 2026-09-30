/* =============================================================================
   LA PLACE D'UNE SURFACE ANCRÉE : INFOBULLE, POPOVER, MENU. Interne : non
   réexporté, sauf ses deux types, que les composants republient.

   UN CALCUL PUR, SANS DOM NI DÉPENDANCE. La surface est posée d'un côté de son
   ancre, alignée sur l'un de ses bords ou sur son centre. Si le côté demandé
   n'a pas la place de la contenir et que le côté opposé l'a, elle BASCULE ; si
   aucun des deux ne l'a, elle prend celui qui en offre le plus. Sur l'axe
   transverse, elle est ramenée dans la fenêtre, à `margin` pixels du bord.

   CE QUI N'EST PAS FAIT, ET POURQUOI. Ni flèche, ni glissement le long d'un
   conteneur défilant autre que la fenêtre, ni bascule sur l'axe transverse
   (de `top` vers `left`) : ce sont les trois raffinements d'une bibliothèque
   de positionnement, et aucun composant d'Opale n'en a besoin aujourd'hui.
   `start` et `end` sont PHYSIQUES — gauche et haut, droite et bas.
   ========================================================================== */

/** Le côté de l'ancre où se pose la surface. */
export type AnchorSide = 'top' | 'bottom' | 'left' | 'right';

/** L'alignement de la surface sur l'axe transverse : bord de début, centre ou bord de fin. */
export type AnchorAlign = 'start' | 'center' | 'end';

interface Box {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

interface Size {
  readonly width: number;
  readonly height: number;
}

export interface AnchorPositionInput {
  readonly anchor: Box;
  readonly floating: Size;
  readonly viewport: Size;
  readonly side: AnchorSide;
  readonly align: AnchorAlign;
  /** L'écart entre l'ancre et la surface, en pixels. */
  readonly offset: number;
  /** La distance minimale au bord de la fenêtre, en pixels. */
  readonly margin: number;
}

export interface AnchorPosition {
  readonly top: number;
  readonly left: number;
  /** Le côté retenu, après bascule éventuelle. */
  readonly side: AnchorSide;
}

const OPPOSITE: Readonly<Record<AnchorSide, AnchorSide>> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const isVertical = (side: AnchorSide): boolean => side === 'top' || side === 'bottom';

/* La place disponible de chaque côté de l'ancre, marge déduite. */
function spaceOn(side: AnchorSide, { anchor, viewport, margin }: AnchorPositionInput): number {
  switch (side) {
    case 'top':
      return anchor.top - margin;
    case 'bottom':
      return viewport.height - (anchor.top + anchor.height) - margin;
    case 'left':
      return anchor.left - margin;
    case 'right':
      return viewport.width - (anchor.left + anchor.width) - margin;
  }
}

function needOn(side: AnchorSide, { floating, offset }: AnchorPositionInput): number {
  return (isVertical(side) ? floating.height : floating.width) + offset;
}

function chooseSide(input: AnchorPositionInput): AnchorSide {
  const preferred = input.side;
  const opposite = OPPOSITE[preferred];
  if (spaceOn(preferred, input) >= needOn(preferred, input)) return preferred;
  if (spaceOn(opposite, input) >= needOn(opposite, input)) return opposite;
  return spaceOn(opposite, input) > spaceOn(preferred, input) ? opposite : preferred;
}

function alignOn(start: number, anchorLength: number, floatingLength: number, align: AnchorAlign) {
  if (align === 'start') return start;
  if (align === 'end') return start + anchorLength - floatingLength;
  return start + (anchorLength - floatingLength) / 2;
}

/* Ramène une coordonnée dans la fenêtre. Une surface plus grande que la
   fenêtre se colle au bord de début : c'est là que commence sa lecture. */
function clamp(value: number, length: number, viewportLength: number, margin: number): number {
  const max = viewportLength - length - margin;
  if (max < margin) return margin;
  return Math.min(Math.max(value, margin), max);
}

/** La position de la surface, en coordonnées de la fenêtre (`position: fixed`). */
export function computeAnchorPosition(input: AnchorPositionInput): AnchorPosition {
  const { anchor, floating, viewport, align, offset, margin } = input;
  const side = chooseSide(input);

  let top: number;
  let left: number;

  if (isVertical(side)) {
    top =
      side === 'top' ? anchor.top - offset - floating.height : anchor.top + anchor.height + offset;
    left = clamp(
      alignOn(anchor.left, anchor.width, floating.width, align),
      floating.width,
      viewport.width,
      margin,
    );
  } else {
    left =
      side === 'left' ? anchor.left - offset - floating.width : anchor.left + anchor.width + offset;
    top = clamp(
      alignOn(anchor.top, anchor.height, floating.height, align),
      floating.height,
      viewport.height,
      margin,
    );
  }

  return { top: Math.round(top), left: Math.round(left), side };
}
