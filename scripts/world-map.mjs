/* =============================================================================
   LES TRACÉS DE LA CARTE DU MONDE ET LES CADRES DE CONTINENT, CALCULÉS HORS
   DU NAVIGATEUR.

   La vitrine n'exécute ni d3-geo ni topojson-client : ce script projette
   `countries-50m` de world-atlas avec Natural Earth I d'usine, arrondit au
   dixième et écrit les tracés en déplacements relatifs (`l`), segments nuls
   retirés. Il projette aussi les cadres de continent, écrits en degrés.
   `world-paths.test.ts` vérifie les deux fichiers contre la projection.

   Usage : `node scripts/world-map.mjs` réécrit `world-paths.json` et
   `continent-frames.json` dans `src/showcase/pages/composants/svg-map/`.
   ========================================================================== */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const ANTARCTICA = '010';

const SVG_MAP_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/showcase/pages/composants/svg-map',
);

export const WORLD_PATHS_FILE = resolve(SVG_MAP_DIR, 'world-paths.json');
export const CONTINENT_FRAMES_FILE = resolve(SVG_MAP_DIR, 'continent-frames.json');

/* Le cadre d'un continent, en degrés `[ouest, sud, est, nord]`, et non l'union
   de ses pays : la France emporte la Guyane, la Russie court jusqu'au
   Pacifique. */
export const CONTINENT_DEGREES = {
  europe: [-25, 34, 45, 71],
  africa: [-19, -36, 53, 38],
  asia: [25, -11, 150, 56],
  americas: [-170, -56, -34, 72],
  oceania: [110, -48, 180, 0],
};

/** Un nombre en dixièmes entiers, écrit au plus court : `.5`, `-.1`, `12`. */
const tenths = (value) => String(value / 10).replace(/^(-?)0\./, '$1.');

/** Deux coordonnées, sans séparateur quand le signe moins en tient lieu. */
const pair = (x, y) => `${tenths(x)}${y < 0 ? '' : ','}${tenths(y)}`;

/**
 * Réécrit un tracé absolu `M…L…Z` : chaque sous-chemin part d'un `M` absolu,
 * puis avance en `l` relatifs. Un segment nul est omis.
 */
export function compactPath(d) {
  const out = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  for (const [, command, body] of d.matchAll(/([MLZ])([^MLZ]*)/g)) {
    if (command === 'Z') {
      out.push('z');
      x = startX;
      y = startY;
      continue;
    }
    const [nextX, nextY] = body.split(',').map((value) => Math.round(Number(value) * 10));
    if (command === 'M') {
      out.push(`M${pair(nextX, nextY)}`);
      startX = nextX;
      startY = nextY;
    } else if (nextX !== x || nextY !== y) {
      out.push(`l${pair(nextX - x, nextY - y)}`);
    }
    x = nextX;
    y = nextY;
  }
  return out.join('');
}

/** Le tracé absolu de chaque forme, tel que d3-geo le rend au dixième. */
export function projectWorld(topology) {
  const path = geoPath(geoNaturalEarth1()).digits(1);
  return feature(topology, topology.objects.countries).features.flatMap((country, index) => {
    const numeric = country.id === undefined ? null : String(country.id);
    if (numeric === ANTARCTICA) return [];
    const d = path(country);
    return d ? [{ index, numeric, name: country.properties.name, d }] : [];
  });
}

/** Les formes du monde, tracés compactés. */
export function buildWorldPaths(topology) {
  return projectWorld(topology).map((shape) => ({ ...shape, d: compactPath(shape.d) }));
}

/**
 * La boîte projetée d'un cadre en degrés. Les méridiens de Natural Earth sont
 * courbes : chaque bord est échantillonné en neuf points, pas seulement les
 * quatre coins.
 */
function projectBox([west, south, east, north], projection) {
  const points = [];
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

/** Les cadres de continent, projetés comme les tracés, en pleine précision. */
export function buildContinentFrames() {
  const projection = geoNaturalEarth1();
  return Object.fromEntries(
    Object.entries(CONTINENT_DEGREES).map(([continent, box]) => [
      continent,
      projectBox(box, projection),
    ]),
  );
}

export function readTopology() {
  const require = createRequire(import.meta.url);
  return JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(WORLD_PATHS_FILE, `${JSON.stringify(buildWorldPaths(readTopology()))}\n`);
  console.log(`✓ ${WORLD_PATHS_FILE}`);
  writeFileSync(CONTINENT_FRAMES_FILE, `${JSON.stringify(buildContinentFrames(), null, 2)}\n`);
  console.log(`✓ ${CONTINENT_FRAMES_FILE}`);
}
