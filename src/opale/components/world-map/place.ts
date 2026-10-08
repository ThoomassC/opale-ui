/* =============================================================================
   CE QUI EST SOUS UN POINT — sans React, sans DOM.

   L'annonce clavier dit où la vue est centrée : « Zoom 3, centré sur France ».
   Le pays se trouve par un test point-dans-polygone sur les fichiers chargés
   (règle pair-impair, trous compris), et se nomme par `Intl.DisplayNames` sur
   son code ISO — jamais par un nom écrit dans les données, qui ne serait que
   d'une langue.
   ========================================================================== */

import { decodeRing, type WorldDataFile } from './data-format';

interface DecodedCountry {
  readonly id: string;
  readonly rings: readonly Float64Array[];
  /** `[ouest, sud, est, nord]` de tous ses anneaux : de quoi écarter vite. */
  readonly box: readonly [number, number, number, number];
}

const decodedCountries = new WeakMap<WorldDataFile, readonly DecodedCountry[]>();

function countriesOf(file: WorldDataFile): readonly DecodedCountry[] {
  const known = decodedCountries.get(file);
  if (known) return known;
  const result = file.countries.map(({ id, r }) => {
    const rings = r.flat().map((line) => decodeRing(line, file.q));
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i += 2) {
        west = Math.min(west, ring[i]);
        east = Math.max(east, ring[i]);
        south = Math.min(south, ring[i + 1]);
        north = Math.max(north, ring[i + 1]);
      }
    }
    return { id, rings, box: [west, south, east, north] as const };
  });
  decodedCountries.set(file, result);
  return result;
}

/** Vrai si le point traverse un nombre impair d'arêtes : dedans, trous compris. */
function inside(rings: readonly Float64Array[], x: number, y: number): boolean {
  let odd = false;
  for (const ring of rings) {
    const n = ring.length;
    for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
      const xi = ring[i];
      const yi = ring[i + 1];
      const xj = ring[j];
      const yj = ring[j + 1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) odd = !odd;
    }
  }
  return odd;
}

/** Le code du pays sous `(longitude, latitude)` dans les fichiers chargés, s'il y en a un. */
export function countryAt(
  files: readonly WorldDataFile[],
  longitude: number,
  latitude: number,
): string | undefined {
  for (const file of files) {
    for (const { id, rings, box } of countriesOf(file)) {
      if (longitude < box[0] || longitude > box[2] || latitude < box[1] || latitude > box[3]) {
        continue;
      }
      if (inside(rings, longitude, latitude)) return id;
    }
  }
  return undefined;
}

/**
 * Le nom d'une région dans une langue, par son code ISO 3166-1 ; `undefined`
 * pour un code que la plateforme ne connaît pas (les territoires sans code
 * ISO portent le code ADM0 de Natural Earth).
 */
export function regionNamer(locale: string): (id: string) => string | undefined {
  let names: Intl.DisplayNames | undefined;
  try {
    names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' });
  } catch {
    names = undefined;
  }
  return (id) => {
    try {
      return names?.of(id) ?? undefined;
    } catch {
      return undefined;
    }
  };
}
