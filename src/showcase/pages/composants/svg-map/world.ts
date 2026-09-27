import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import topology from 'world-atlas/countries-110m.json';

import type { SvgMapBounds, SvgMapRegion } from '../../../../magic';
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

   Le jeu `countries-110m` de world-atlas (licence ISC, données Natural Earth du
   domaine public) est la résolution légère : 177 formes, assez pour une vue
   du monde. L'Antarctique est retiré — il occuperait le cinquième bas du cadre
   pour une zone qu'aucune démonstration ne désigne.
   ========================================================================== */

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 500;

export const WORLD_VIEWBOX = `0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`;

const ANTARCTICA = '010';

export interface WorldCountry extends SvgMapRegion {
  readonly continent?: Continent;
}

const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });

/* LA PROJECTION EST PARTAGÉE, et doit l'être : les tracés et les cadres des
   continents se calculent avec la même, sans quoi un cadre et une côte ne
   tomberaient pas au même endroit. Ses réglages d'usine ne sont jamais
   modifiés. */
const projection = geoNaturalEarth1();

function buildWorld(): readonly WorldCountry[] {
  const path = geoPath(projection).digits(1);
  const collection = feature(topology, topology.objects.countries);

  return collection.features.flatMap((country, index) => {
    const numeric = country.id === undefined ? null : String(country.id);
    if (numeric === ANTARCTICA) return [];

    const d = path(country);
    if (!d) return [];

    const alpha2 = numeric === null ? undefined : ALPHA2_BY_NUMERIC.get(numeric);
    /* Trois formes n'ont pas d'identifiant ISO — Chypre du Nord, Somaliland,
       Kosovo : elles restent dessinées, c'est la côte, sous leur nom anglais
       et un identifiant de secours. */
    const name = alpha2
      ? (regionNames.of(alpha2) ?? country.properties.name)
      : country.properties.name;

    return [
      {
        id: alpha2 ?? `sans-code-${index}`,
        path: d,
        name,
        continent: alpha2 ? continentOf(alpha2) : undefined,
      },
    ];
  });
}

export const WORLD_COUNTRIES = buildWorld();

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
