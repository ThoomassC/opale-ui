/* =============================================================================
   LES TRACÉS DE LA CARTE DU MONDE, CALCULÉS UNE FOIS, HORS DU NAVIGATEUR.

   La page « SvgMap » de la vitrine projetait `countries-50m` de world-atlas à
   chaque chargement : 225 kB gzip de topologie, plus d3-geo et
   topojson-client, pour produire toujours les mêmes chaînes. Ce script produit
   ces chaînes d'avance, avec la même projection et le même arrondi au dixième.

   LE RÉSULTAT EST LE MÊME DESSIN. Les coordonnées arrondies sont réécrites en
   déplacements relatifs (`l`), calculés en dixièmes entiers — donc exacts —,
   et les segments de longueur nulle que l'arrondi a produits sont retirés :
   ils ne peignent rien. `world-paths.test.ts` le vérifie point par point.

   Usage : `node scripts/world-map.mjs` réécrit
   `src/showcase/pages/composants/svg-map/world-paths.json`.
   ========================================================================== */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const ANTARCTICA = '010';

export const WORLD_PATHS_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/showcase/pages/composants/svg-map/world-paths.json',
);

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

export function readTopology() {
  const require = createRequire(import.meta.url);
  return JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(WORLD_PATHS_FILE, `${JSON.stringify(buildWorldPaths(readTopology()))}\n`);
  console.log(`✓ ${WORLD_PATHS_FILE}`);
}
