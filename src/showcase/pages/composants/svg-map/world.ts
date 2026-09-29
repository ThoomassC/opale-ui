import { geoNaturalEarth1 } from 'd3-geo';

import worldPaths from './world-paths.json';

import type { SvgMapBounds, SvgMapRegion } from '../../../../opale';
import { ALPHA2_BY_NUMERIC, continentOf, type Continent } from './world-codes';

/* =============================================================================
   LA CARTE DU MONDE, CONSTRUITE COMME DANS « TRAVELS IN WORLD ».

   Trois choix repris de ce projet, et chacun a sa raison.

   1. NATURAL EARTH I, DANS SON CADRE NATUREL, SANS `fitSize`. Les réglages
      d'usine de `geoNaturalEarth1()` — translation [480, 250], échelle 175,3 —
      posent le monde entier dans un cadre de 960 × 500 : ce cadre EST celui de
      la projection. Ajuster à la géométrie ferait dépendre les côtes du jeu de
      données : un autre millésime déplacerait Tokyo.

   2. LA JOINTURE SUR LE CODE ISO NUMÉRIQUE, JAMAIS SUR LE NOM. Le jeu de
      données écrit « W. Sahara » ou « Dem. Rep. Congo » ; le numérique est
      stable. Il donne le code alpha-2, et l'alpha-2 le nom français par
      `Intl.DisplayNames` — celui que la page doit afficher.

   3. DES TRACÉS ARRONDIS AU DIXIÈME. Au zoom maximal de la carte, un dixième
      d'unité reste sous le pixel, et le poids des chemins tombe de moitié.

   LES TRACÉS SONT PRÉCALCULÉS. `scripts/world-map.mjs` fait la projection une
   fois, avec ces mêmes réglages, et écrit `world-paths.json` en déplacements
   relatifs : 120 kB gzip au lieu des 225 kB de la topologie, et ni d3-geo ni
   topojson-client à exécuter au chargement pour obtenir les mêmes chaînes.
   `world-paths.test.ts` vérifie que le dessin est le même, point par point.

   LE JEU 50m, COMME DANS TRAVELS IN WORLD. `countries-50m` de world-atlas
   (licence ISC, données Natural Earth du domaine public) porte 241 formes ;
   le 110m n'en avait que 177 — ni Singapour, ni Malte, ni Bahreïn, et des
   côtes taillées à la serpe dès qu'on zoome sur l'Europe. Le coût est au
   chargement de CETTE page seulement : le jeu n'entre ni dans la librairie ni
   dans le bundle principal de la vitrine. L'Antarctique est retiré — il
   occuperait le cinquième bas du cadre pour une zone qu'aucune démonstration
   ne désigne.
   ========================================================================== */

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 500;

export const WORLD_VIEWBOX = `0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`;

export interface WorldCountry extends SvgMapRegion {
  readonly continent?: Continent;
}

const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });

/* LA PROJECTION EST LA MÊME que celle des tracés précalculés, et doit l'être :
   sans quoi un cadre de continent et une côte ne tomberaient pas au même
   endroit. Ses réglages d'usine ne sont jamais modifiés. */
const projection = geoNaturalEarth1();

/* UNE RÉGION PAR CODE ISO. Le 50m écrit deux formes sous le numérique 036 —
   l'Australie et les îles Ashmore-et-Cartier, qui en sont un territoire. Deux
   régions de même identifiant feraient deux boutons indiscernables pour la
   sélection et le focus : leurs tracés sont réunis dans un seul `d`, qui
   accepte plusieurs sous-chemins, sous le nom de la première forme. */
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

/* =============================================================================
   LE CADRE D'UN CONTINENT, EN DEGRÉS, PUIS PROJETÉ.

   Un continent ne se cadre pas sur l'union de ses pays : dans le jeu mondial,
   la France emporte la Guyane — sa boîte descend jusqu'en Amérique du Sud — et
   la Russie court jusqu'au Pacifique. Cadrer « l'Europe » sur ses pays
   montrait presque le monde entier. Chaque cadre est donc écrit en longitudes
   et latitudes, et projeté avec la même projection que les tracés.

   Les méridiens de Natural Earth sont COURBES : un rectangle en degrés devient
   une forme bombée. Ses bords sont échantillonnés, et la boîte englobe tous
   les points — pas seulement les quatre coins.
   ========================================================================== */
const CONTINENT_DEGREES: Readonly<
  Record<Exclude<Continent, 'antarctica'>, readonly [number, number, number, number]>
> = {
  // [ouest, sud, est, nord]
  europe: [-25, 34, 45, 71],
  africa: [-19, -36, 53, 38],
  asia: [25, -11, 150, 56],
  americas: [-170, -56, -34, 72],
  oceania: [110, -48, 180, 0],
};

function projectBox([west, south, east, north]: readonly [
  number,
  number,
  number,
  number,
]): SvgMapBounds {
  const points: [number, number][] = [];
  for (let step = 0; step <= 8; step += 1) {
    const lon = west + ((east - west) * step) / 8;
    const lat = south + ((north - south) * step) / 8;
    points.push([lon, south], [lon, north], [west, lat], [east, lat]);
  }
  const projected = points.flatMap((point) => {
    const xy = projection(point);
    return xy ? [xy] : [];
  });
  return {
    minX: Math.min(...projected.map(([x]) => x)),
    minY: Math.min(...projected.map(([, y]) => y)),
    maxX: Math.max(...projected.map(([x]) => x)),
    maxY: Math.max(...projected.map(([, y]) => y)),
  };
}

export const CONTINENT_FRAMES = Object.fromEntries(
  Object.entries(CONTINENT_DEGREES).map(([continent, box]) => [continent, projectBox(box)]),
) as Readonly<Record<keyof typeof CONTINENT_DEGREES, SvgMapBounds>>;
