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

/**
 * La position de défilement — en valeur absolue, depuis le départ — qui
 * amène chaque diapositive au bord de départ de la piste. `scroll` est le
 * défilement actuel, lui aussi en valeur absolue (négatif de droite à gauche).
 */
export function slideOffsets(
  track: HorizontalRect,
  slides: readonly HorizontalRect[],
  scroll: number,
  rtl: boolean,
): number[] {
  return slides.map(
    (slide) => scroll + (rtl ? track.right - slide.right : slide.left - track.left),
  );
}

/** Une position que le défilement peut atteindre, et les diapositives qu'elle montre au départ. */
export interface SlideStop {
  /** La position de défilement, ramenée dans `[0, max]`. */
  readonly position: number;
  /** La première et la dernière diapositive ramenées à cette position. */
  readonly first: number;
  readonly last: number;
  /** La diapositive qui la nomme : la dernière au bout de la piste, la première sinon. */
  readonly index: number;
}

/**
 * Les positions atteignables. Le défilement s'arrête à `max` : les
 * diapositives qui ne peuvent venir au bord de départ partagent la position
 * du bout, et n'en font qu'une — celle de la dernière, entièrement visible.
 */
export function slideStops(offsets: readonly number[], max: number): SlideStop[] {
  const end = Math.max(0, max);
  const groups: { position: number; first: number; last: number }[] = [];
  offsets.forEach((offset, index) => {
    const position = Math.min(Math.max(offset, 0), end);
    const previous = groups.at(-1);
    if (previous && Math.abs(position - previous.position) <= 2) previous.last = index;
    else groups.push({ position, first: index, last: index });
  });
  return groups.map((group) => ({
    ...group,
    index: group.position > 0 && group.position >= end - 2 ? group.last : group.first,
  }));
}

/** L'index de la position la plus proche du défilement `scroll`. */
export function nearestStop(stops: readonly SlideStop[], scroll: number): number {
  let best = 0;
  stops.forEach((stop, at) => {
    if (Math.abs(stop.position - scroll) < Math.abs((stops[best]?.position ?? 0) - scroll))
      best = at;
  });
  return best;
}
