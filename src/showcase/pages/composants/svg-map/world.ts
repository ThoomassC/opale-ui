import continentFrames from './continent-frames.json';
import worldPaths from './world-paths.json';

import type { SvgMapRegion } from '../../../../opale';
import { ALPHA2_BY_NUMERIC, continentOf, type Continent } from './world-codes';

/* La carte du monde de la démonstration, sur le modèle de « Travels in World ».

   Natural Earth I d'usine, sans `fitSize` : le cadre 960 × 500 est celui de la
   projection et ne dépend pas des données. Jointure sur le code ISO numérique,
   nom français par `Intl.DisplayNames`. Jeu 50m de world-atlas (licence ISC,
   Natural Earth), Antarctique retiré.

   Tracés et cadres de continent sont précalculés par `scripts/world-map.mjs` :
   la page n'exécute ni d3-geo ni topojson-client, et `world-paths.test.ts`
   vérifie les deux fichiers contre la projection. */

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 500;

export const WORLD_VIEWBOX = `0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`;

export interface WorldCountry extends SvgMapRegion {
  readonly continent?: Continent;
}

const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });

/* Une région par code ISO : les formes qui partagent un numérique (036,
   Australie et Ashmore-et-Cartier) sont réunies dans un seul `d`, sous le nom
   de la première. */
function mergeById(countries: readonly WorldCountry[]): readonly WorldCountry[] {
  const byId = new Map<string, WorldCountry>();
  for (const country of countries) {
    const known = byId.get(country.id);
    byId.set(country.id, known ? { ...known, path: `${known.path}${country.path}` } : country);
  }
  return [...byId.values()];
}

function buildWorld(): readonly WorldCountry[] {
  return worldPaths.map(({ index, numeric, name: sourceName, d }) => {
    const alpha2 = numeric === null ? undefined : ALPHA2_BY_NUMERIC.get(numeric);
    /* Cinq formes n'ont pas d'identifiant ISO — Somaliland, Kosovo, Chypre du
       Nord, les territoires de l'océan Indien et le glacier de Siachen : elles
       restent dessinées, c'est la côte, sous leur nom anglais et un
       identifiant de secours. */
    const name = alpha2 ? (regionNames.of(alpha2) ?? sourceName) : sourceName;

    return {
      id: alpha2 ?? `sans-code-${index}`,
      path: d,
      name,
      continent: alpha2 ? continentOf(alpha2) : undefined,
    };
  });
}

export const WORLD_COUNTRIES = mergeById(buildWorld());

/** Les pays d'un continent. */
export function countriesOf(continent: Continent): readonly string[] {
  return WORLD_COUNTRIES.filter((country) => country.continent === continent).map(
    (country) => country.id,
  );
}

/* Le cadre de chaque continent, écrit en degrés puis projeté par
   `scripts/world-map.mjs` : un continent ne se cadre pas sur l'union de ses
   pays (la France emporte la Guyane). */
export const CONTINENT_FRAMES = continentFrames;
