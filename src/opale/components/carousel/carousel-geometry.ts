/* =============================================================================
   CE QUE LA PISTE MONTRE, CALCULÉ SANS LE DOM. Interne : non réexporté.

   Deux fonctions pures, nourries de rectangles (`getBoundingClientRect`) :
   elles se testent sans mise en page, que jsdom n'a pas.
   ========================================================================== */

/** Les bords horizontaux d'une boîte, en pixels de la fenêtre. */
export interface HorizontalRect {
  readonly left: number;
  readonly right: number;
}

/* Un pixel de recouvrement ne fait pas une diapositive visible : l'arrondi
   des positions en laisse toujours dépasser un peu. */
const TOLERANCE = 4;

/**
 * Les index des diapositives dont une part est dans la piste. Une piste sans
 * largeur — pas de mise en page, ou masquée — les tient toutes pour visibles :
 * rien ne doit devenir inerte faute de mesure.
 */
export function visibleSlides(track: HorizontalRect, slides: readonly HorizontalRect[]): number[] {
  const all = track.right - track.left <= 0;
  return slides.flatMap((slide, index) =>
    all || (slide.right > track.left + TOLERANCE && slide.left < track.right - TOLERANCE)
      ? [index]
      : [],
  );
}

/** L'index de la diapositive dont le bord de départ est le plus proche de celui de la piste. */
export function nearestSlide(
  track: HorizontalRect,
  slides: readonly HorizontalRect[],
  rtl: boolean,
): number {
  let best = 0;
  let bestDistance = Infinity;
  slides.forEach((slide, index) => {
    const distance = Math.abs(rtl ? slide.right - track.right : slide.left - track.left);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}
