/* =============================================================================
   LE PLACEMENT DES ÉTIQUETTES DE `WorldMap` — sans React, sans DOM.

   Un algorithme GLOUTON et DÉTERMINISTE : les candidats sont triés, puis
   posés un à un tant que leur boîte ne chevauche aucune étiquette déjà posée
   et tient dans le cadre. Pas de mesure du texte dans le DOM — le rendu
   serveur doit poser les mêmes étiquettes que le client : une boîte vaut
   `caractères × 0,55 em` de large et une hauteur de police de haut.

   L'ordre : les pays d'abord, par importance (`min_label` de Natural Earth,
   le plus petit d'abord) ; puis les villes, capitales d'abord, puis par
   population. Au plus 40 pays et 60 villes. Les égalités se départagent par
   identifiant : l'ordre d'arrivée des candidats ne change rien.
   ========================================================================== */

export const MAX_COUNTRY_LABELS = 40;
export const MAX_CITY_LABELS = 60;

/** Largeur moyenne d'un caractère, en em. */
const CHAR_WIDTH = 0.55;

export interface LabelBox {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface CountryCandidate {
  readonly id: string;
  readonly text: string;
  /** Le point d'ancrage, en unités du cadre. */
  readonly x: number;
  readonly y: number;
  /** `MIN_LABEL` de Natural Earth : plus il est petit, plus le pays compte. */
  readonly minLabel: number;
}

export interface CityCandidate {
  readonly id: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly population: number;
  readonly capital: boolean;
}

export interface PlacedLabel {
  readonly id: string;
  readonly text: string;
  readonly kind: 'country' | 'city';
  readonly x: number;
  readonly y: number;
  readonly box: LabelBox;
}

export interface LabelOptions {
  /** Le cadre, en unités du `viewBox`. */
  readonly width: number;
  readonly height: number;
  /** Les tailles de police, en unités du cadre. */
  readonly countryFontSize: number;
  readonly cityFontSize: number;
}

/**
 * La boîte d'une étiquette. `center` : centrée sur le point (un pays) ;
 * `start` : à droite du point, après un demi-em (une ville et son point).
 */
export function labelBox(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  anchor: 'center' | 'start',
): LabelBox {
  const width = [...text].length * CHAR_WIDTH * fontSize;
  const left = anchor === 'center' ? x - width / 2 : x + fontSize / 2;
  return { left, right: left + width, top: y - fontSize / 2, bottom: y + fontSize / 2 };
}

const collides = (a: LabelBox, b: LabelBox) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const byId = (a: { readonly id: string }, b: { readonly id: string }) =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Pose les étiquettes : pays, puis villes. */
export function placeLabels(
  countries: readonly CountryCandidate[],
  cities: readonly CityCandidate[],
  { width, height, countryFontSize, cityFontSize }: LabelOptions,
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const fits = (box: LabelBox) =>
    box.left >= 0 &&
    box.top >= 0 &&
    box.right <= width &&
    box.bottom <= height &&
    !placed.some((label) => collides(label.box, box));

  const sortedCountries = [...countries].sort((a, b) => a.minLabel - b.minLabel || byId(a, b));
  let countryCount = 0;
  for (const country of sortedCountries) {
    if (countryCount >= MAX_COUNTRY_LABELS) break;
    const box = labelBox(country.text, country.x, country.y, countryFontSize, 'center');
    if (!fits(box)) continue;
    placed.push({
      id: country.id,
      text: country.text,
      kind: 'country',
      x: country.x,
      y: country.y,
      box,
    });
    countryCount += 1;
  }

  const sortedCities = [...cities].sort(
    (a, b) => Number(b.capital) - Number(a.capital) || b.population - a.population || byId(a, b),
  );
  let cityCount = 0;
  for (const city of sortedCities) {
    if (cityCount >= MAX_CITY_LABELS) break;
    const box = labelBox(city.text, city.x, city.y, cityFontSize, 'start');
    if (!fits(box)) continue;
    placed.push({ id: city.id, text: city.text, kind: 'city', x: city.x, y: city.y, box });
    cityCount += 1;
  }
  return placed;
}
