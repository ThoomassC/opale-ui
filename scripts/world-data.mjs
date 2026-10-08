/* =============================================================================
   LES DONNÉES DE `WorldMap`, PRÉPARÉES HORS DU NAVIGATEUR.

   Natural Earth (domaine public) est téléchargé depuis naciscdn.org, aux URL
   épinglées ci-dessous, et chaque archive est comparée à son empreinte
   SHA-256 avant d'être lue : une archive qui ne correspond pas arrête tout.
   Les archives sont gardées dans `.cache/natural-earth/` (ignoré par git) et
   ne sont jamais décompressées sur le disque ni exécutées — mapshaper lit
   leurs fichiers de formes comme des données.

   Trois niveaux de détail, écrits dans `public/world-map/v1/` :
   - `110m.json` et `50m.json`, le monde entier en un fichier chacun ;
   - `10m/{col}_{row}.json`, une grille de 10° × 10° (36 colonnes depuis
     −180°, 18 rangées depuis le nord), cellules non vides seulement, toutes
     listées dans `index.json`.

   Le format est un JSON quantifié en deltas (voir `data-format.ts`), pas du
   TopoJSON : le navigateur n'a qu'à additionner des entiers. Les remplissages
   (pays, lacs) n'ont pas de contour ; les côtes et les frontières viennent
   de leurs propres couches de lignes. Les budgets de poids sont vérifiés à la
   fin : au-delà, le script échoue sans rien laisser de partiel derrière lui.

   LE DOSSIER EST VERSIONNÉ, ET IMMUABLE UNE FOIS PUBLIÉ. Les niveaux et les
   tuiles sont servis pour un an sans revalidation (`vercel.json`) ; seul
   `index.json` se revalide. Une régénération qui change le contenu des
   fichiers doit donc écrire un nouveau dossier (`v2`), pas réécrire `v1`.

   Usage : `node scripts/world-data.mjs`.
   ========================================================================== */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const NATURAL_EARTH_VERSION = '5.1.2';
export const OUTPUT_DIR = join(ROOT, 'public/world-map/v1');
export const CACHE_DIR = join(ROOT, '.cache/natural-earth');
export const TILE_DEGREES = 10;
/** L'élargissement du cadre de découpe des remplissages : les tuiles voisines se recouvrent, sans couture. */
export const FILL_MARGIN = 0.05;

/** Budgets de poids, en octets (1 Ko = 1 000 o). */
export const BUDGETS = {
  '110m': { raw: 250_000, gzip: 80_000 },
  '50m': { raw: 1_500_000, gzip: 450_000 },
  tile: 400_000,
  total10m: 15_000_000,
};

const source = (scale, theme, name, sha256) => ({
  scale,
  theme,
  name,
  url: `https://naciscdn.org/naturalearth/${scale}/${theme}/${name}.zip`,
  sha256,
});

/* Empreintes relevées le 08/10/2026 sur la publication 5.1.2. Une archive
   republiée sous la même URL change d'empreinte : le script s'arrête, et
   c'est à un humain de vérifier puis de mettre l'empreinte à jour. */
export const SOURCES = [
  source(
    '110m',
    'cultural',
    'ne_110m_admin_0_countries',
    '0f243aeac8ac6cf26f0417285b0bd33ac47f1b5bdb719fd3e0df37d03ea37110',
  ),
  source(
    '110m',
    'cultural',
    'ne_110m_admin_0_boundary_lines_land',
    'bb2954981570498a4b4344f8e83fa54caa5858e15e800094112407d2bd2f940d',
  ),
  source(
    '110m',
    'physical',
    'ne_110m_coastline',
    '664449b39070027e882abb295974d182afec18ca21107273d17e9e8bf6f64817',
  ),
  source(
    '110m',
    'physical',
    'ne_110m_lakes',
    'f2eed3c738a93010770acb0ba44273ea6a83b053641588bc902d9d6fd1cdafcb',
  ),
  source(
    '110m',
    'physical',
    'ne_110m_rivers_lake_centerlines',
    '1a010128c0801de738307eda7fd0ad3533a5985bc7e223c6640bdd749495f655',
  ),
  source(
    '50m',
    'cultural',
    'ne_50m_admin_0_countries',
    '5fed433373581fa648920435f937d95f2d3c0200e067409c6478dcdf1b853139',
  ),
  source(
    '50m',
    'cultural',
    'ne_50m_admin_0_boundary_lines_land',
    '02f369ae10578c4ce33fc4a08f8cdd69ea11eb39b44d7923e88eb7199aaff8ea',
  ),
  source(
    '50m',
    'physical',
    'ne_50m_coastline',
    '640f805509b822f57f4840a2e18d9ff2412cf1cf6976124701c2789436166fde',
  ),
  source(
    '50m',
    'physical',
    'ne_50m_lakes',
    'f28d42c286d96b57a17aac2cbeb432f8c65532c20063495711fbc64e24666df3',
  ),
  source(
    '50m',
    'physical',
    'ne_50m_rivers_lake_centerlines',
    'c607d9d7e7702827a7996fff6dc17b87a338c5ed3b52d12c402e0c9669cc7b56',
  ),
  source(
    '10m',
    'cultural',
    'ne_10m_admin_0_countries',
    'ce1ac7036499a0edd641fbc093cd209a98f96a49d2eca8480aaacad35138a7f6',
  ),
  source(
    '10m',
    'cultural',
    'ne_10m_admin_0_boundary_lines_land',
    '16ead035f539c8b6c23650c5845d86ad3556553e7456bdf9b4730210f26aacbe',
  ),
  source(
    '10m',
    'physical',
    'ne_10m_coastline',
    'bfa04cdbcbef07ef90dfca1dabb48062eca29900a113df0f389303e255484017',
  ),
  source(
    '10m',
    'physical',
    'ne_10m_lakes',
    '0803a06f9c3cb4671d89b68c48b142aad9366ba40f665245e12a913fbc61722a',
  ),
  source(
    '10m',
    'physical',
    'ne_10m_rivers_lake_centerlines',
    'ded71b01870855ccfe19b51f2ec14c9bb48fae23c0e9f3c11974d426433b5c38',
  ),
  source(
    '10m',
    'cultural',
    'ne_10m_admin_1_states_provinces_lines',
    '86acd56ce6c0e47f5fa79725591533b5766f26d6ed1437b086f2b8d4028fe456',
  ),
  /* La version complète, pas `populated_places_simple` : seule elle porte
     les noms français et anglais (`NAME_FR`, `NAME_EN`). */
  source(
    '10m',
    'cultural',
    'ne_10m_populated_places',
    'cd149186f03d2603e0410da399b980a4357d0ac32d3a2305a49ed3dffcc41d7b',
  ),
];

/* Réglages par niveau : pas de quantification (degrés), intervalle de
   simplification Visvalingam (mètres, 0 = aucune), et `min_zoom` maximal des
   villes embarquées dans les fichiers du monde entier. */
const LEVELS = {
  '110m': { step: 0.01, simplify: 0, placesBelow: 4 },
  '50m': { step: 0.01, simplify: 1000, placesBelow: 5 },
  '10m': { step: 0.001, simplify: 300 },
};

/* -----------------------------------------------------------------------------
   Fonctions pures (testées par `world-data.test.ts`).
   -------------------------------------------------------------------------- */

/** L'empreinte SHA-256 d'un contenu, en hexadécimal. */
export function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Quantifie une ligne ou un anneau : `[x0, y0, dx1, dy1, …]`, entiers, où
 * `lon = ox + x × step` et `lat = oy + y × step`. Les points répétés tombent,
 * ainsi que le point de fermeture d'un anneau. `null` quand il ne reste rien
 * à dessiner : moins de deux points pour une ligne, de trois pour un anneau.
 */
export function quantize(coords, [ox, oy, step], closed) {
  const points = [];
  for (const [lon, lat] of coords) {
    const x = Math.round((lon - ox) / step);
    const y = Math.round((lat - oy) / step);
    const last = points[points.length - 1];
    if (!last || last[0] !== x || last[1] !== y) points.push([x, y]);
  }
  if (closed && points.length > 1) {
    const [first, last] = [points[0], points[points.length - 1]];
    if (first[0] === last[0] && first[1] === last[1]) points.pop();
  }
  if (points.length < (closed ? 3 : 2)) return null;
  const out = [points[0][0], points[0][1]];
  for (let i = 1; i < points.length; i += 1) {
    out.push(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return out;
}

const EDGES = [
  /* [axe, limite, garder le côté supérieur ?] */
  [0, 0, true],
  [0, 2, false],
  [1, 1, true],
  [1, 3, false],
];

const insideEdge = (point, axis, limit, keepAbove) =>
  keepAbove ? point[axis] >= limit : point[axis] <= limit;

const crossEdge = (a, b, axis, limit) => {
  const t = (limit - a[axis]) / (b[axis] - a[axis]);
  const other = 1 - axis;
  const point = [0, 0];
  point[axis] = limit;
  point[other] = a[other] + t * (b[other] - a[other]);
  return point;
};

const withinBox = (ring, [west, south, east, north]) =>
  ring.every(([x, y]) => x >= west && x <= east && y >= south && y <= north);

/**
 * Découpe un anneau par une boîte `[ouest, sud, est, nord]` (Sutherland-
 * Hodgman). Les arêtes dégénérées qu'il laisse sur les bords ne se voient
 * pas : un remplissage n'a pas de contour.
 */
export function clipRing(ring, box) {
  if (withinBox(ring, box)) return ring;
  let output = ring;
  for (const [axis, index, keepAbove] of EDGES) {
    const limit = box[index];
    const input = output;
    output = [];
    if (input.length === 0) break;
    let previous = input[input.length - 1];
    for (const current of input) {
      const currentIn = insideEdge(current, axis, limit, keepAbove);
      const previousIn = insideEdge(previous, axis, limit, keepAbove);
      if (currentIn) {
        if (!previousIn) output.push(crossEdge(previous, current, axis, limit));
        output.push(current);
      } else if (previousIn) {
        output.push(crossEdge(previous, current, axis, limit));
      }
      previous = current;
    }
  }
  return output.filter((point, index) => {
    const before = output[index - 1];
    return !before || before[0] !== point[0] || before[1] !== point[1];
  });
}

/** Découpe un segment par une boîte (Liang-Barsky) ; `null` s'il est dehors. */
function clipSegment(a, b, [west, south, east, north]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  let t0 = 0;
  let t1 = 1;
  for (const [p, q] of [
    [-dx, a[0] - west],
    [dx, east - a[0]],
    [-dy, a[1] - south],
    [dy, north - a[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }
  const at = (t) => (t === 0 ? a : t === 1 ? b : [a[0] + t * dx, a[1] + t * dy]);
  return [at(t0), at(t1)];
}

/** Découpe une ligne par une boîte : un morceau par passage dedans. */
export function clipLine(line, box) {
  if (withinBox(line, box)) return [line];
  const pieces = [];
  let current = null;
  for (let i = 1; i < line.length; i += 1) {
    const segment = clipSegment(line[i - 1], line[i], box);
    if (!segment) {
      current = null;
      continue;
    }
    const [start, end] = segment;
    const last = current?.[current.length - 1];
    if (current && last[0] === start[0] && last[1] === start[1]) {
      current.push(end);
    } else {
      current = [start, end];
      pieces.push(current);
    }
    /* Le segment sort de la boîte : le morceau s'arrête là. */
    if (end !== line[i]) current = null;
  }
  return pieces;
}

/** La clé d'une tuile 10m : `col_row`. */
export function tileKey(col, row) {
  return `${col}_${row}`;
}

/** La boîte d'une tuile : colonnes depuis −180°, rangées depuis le nord. */
export function tileBox(col, row) {
  const west = -180 + col * TILE_DEGREES;
  const north = 90 - row * TILE_DEGREES;
  return [west, north - TILE_DEGREES, west + TILE_DEGREES, north];
}

const clampInt = (value, min, max) => Math.min(max, Math.max(min, value));

/** Les tuiles `[col, row]` qu'une boîte recouvre, rangée par rangée. */
export function tilesCovering([west, south, east, north]) {
  const colMin = clampInt(Math.floor((west + 180) / TILE_DEGREES), 0, 35);
  const colMax = clampInt(Math.ceil((east + 180) / TILE_DEGREES) - 1, colMin, 35);
  const rowMin = clampInt(Math.floor((90 - north) / TILE_DEGREES), 0, 17);
  const rowMax = clampInt(Math.ceil((90 - south) / TILE_DEGREES) - 1, rowMin, 17);
  const tiles = [];
  for (let row = rowMin; row <= rowMax; row += 1) {
    for (let col = colMin; col <= colMax; col += 1) tiles.push([col, row]);
  }
  return tiles;
}

/**
 * Les budgets dépassés, en phrases ; un tableau vide quand tout tient.
 * `files` : `{ name, raw, gzip }`, `name` relatif à `public/world-map/v1/`.
 */
export function checkBudgets(files) {
  const violations = [];
  let total10m = 0;
  for (const { name, raw, gzip } of files) {
    const budget =
      name === '110m.json' ? BUDGETS['110m'] : name === '50m.json' ? BUDGETS['50m'] : null;
    if (budget) {
      if (raw > budget.raw) violations.push(`${name} : ${raw} o bruts > ${budget.raw} o`);
      if (gzip > budget.gzip) violations.push(`${name} : ${gzip} o gzip > ${budget.gzip} o`);
    } else if (name.startsWith('10m/')) {
      total10m += raw;
      if (raw > BUDGETS.tile) violations.push(`${name} : ${raw} o > ${BUDGETS.tile} o`);
    }
  }
  if (total10m > BUDGETS.total10m) {
    violations.push(`10m au total : ${total10m} o > ${BUDGETS.total10m} o`);
  }
  return violations;
}

/* -----------------------------------------------------------------------------
   Téléchargement vérifié et lecture des couches.
   -------------------------------------------------------------------------- */

/** Le chemin d'une archive en cache, téléchargée au besoin, et toujours vérifiée. */
export async function verifiedArchive({ name, url, sha256: expected }, cacheDir = CACHE_DIR) {
  const file = join(cacheDir, `${name}.zip`);
  if (existsSync(file) && sha256(readFileSync(file)) === expected) return file;

  if (!url.startsWith('https://naciscdn.org/naturalearth/')) {
    throw new Error(`${name} : source non autorisée (${url})`);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${name} : ${response.status} ${response.statusText}`);
  const data = new Uint8Array(await response.arrayBuffer());
  const actual = sha256(data);
  if (actual !== expected) {
    throw new Error(`${name} : empreinte ${actual}, attendue ${expected} — archive refusée`);
  }
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(`${file}.part`, data);
  renameSync(`${file}.part`, file);
  return file;
}

/** Une propriété, quelle que soit la casse de son nom (elle varie d'une couche à l'autre). */
function prop(properties, key) {
  const wanted = key.toLowerCase();
  for (const [name, value] of Object.entries(properties)) {
    if (name.toLowerCase() === wanted) return value;
  }
  return undefined;
}

/** Les entités GeoJSON d'une archive, simplifiées au besoin. */
async function readLayer(sourceName, simplify) {
  const { default: mapshaper } = await import('mapshaper');
  const archive = await verifiedArchive(SOURCES.find((item) => item.name === sourceName));
  const simplification =
    simplify > 0 ? `-simplify visvalingam interval=${simplify} keep-shapes` : '';
  const out = await mapshaper.applyCommands(
    `-i "${archive}" -target ${sourceName} ${simplification} -o format=geojson out.json`,
  );
  return JSON.parse(out['out.json']).features.filter((item) => item.geometry);
}

/** Les polygones d'une géométrie : `[anneau extérieur, …trous][]`. */
const polygonsOf = (geometry) =>
  geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];

/** Les lignes d'une géométrie. */
const linesOf = (geometry) =>
  geometry.type === 'LineString'
    ? [geometry.coordinates]
    : geometry.type === 'MultiLineString'
      ? geometry.coordinates
      : [];

/* Les boîtes sont mémorisées : chaque tuile interroge chaque entité. */
const boxes = new WeakMap();
const boxOf = (points) => {
  const known = boxes.get(points);
  if (known) return known;
  let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of points) {
    if (x < west) west = x;
    if (x > east) east = x;
    if (y < south) south = y;
    if (y > north) north = y;
  }
  const box = [west, south, east, north];
  boxes.set(points, box);
  return box;
};

const round = (value, digits) => Number(value.toFixed(digits));

/** L'identifiant d'un pays : ISO 3166-1 alpha-2, sinon le code ADM0_A3 de Natural Earth. */
const countryId = (properties) => {
  const iso = prop(properties, 'ISO_A2_EH');
  return typeof iso === 'string' && /^[A-Z]{2}$/.test(iso)
    ? iso
    : String(prop(properties, 'ADM0_A3'));
};

/* Les couches d'un niveau, lues une fois, en coordonnées géographiques. */
async function readLevel(scale) {
  const { simplify } = LEVELS[scale];
  const countries = new Map();
  const countryLabels = [];
  for (const item of await readLayer(`ne_${scale}_admin_0_countries`, simplify)) {
    const id = countryId(item.properties);
    const polygons = countries.get(id) ?? [];
    polygons.push(...polygonsOf(item.geometry));
    countries.set(id, polygons);
    const [lon, lat] = [prop(item.properties, 'LABEL_X'), prop(item.properties, 'LABEL_Y')];
    if (typeof lon === 'number' && typeof lat === 'number') {
      countryLabels.push({
        id,
        lon: round(lon, 3),
        lat: round(lat, 3),
        min: prop(item.properties, 'MIN_LABEL'),
        max: prop(item.properties, 'MAX_LABEL'),
      });
    }
  }
  const lakes = (await readLayer(`ne_${scale}_lakes`, simplify)).flatMap((item) =>
    polygonsOf(item.geometry),
  );
  const coast = (await readLayer(`ne_${scale}_coastline`, simplify)).flatMap((item) =>
    linesOf(item.geometry),
  );
  const borders = (await readLayer(`ne_${scale}_admin_0_boundary_lines_land`, simplify)).flatMap(
    (item) => linesOf(item.geometry),
  );
  const rivers = (await readLayer(`ne_${scale}_rivers_lake_centerlines`, simplify)).flatMap(
    (item) =>
      linesOf(item.geometry).map((line) => ({ mz: prop(item.properties, 'min_zoom'), line })),
  );
  const admin1 =
    scale === '10m'
      ? (await readLayer('ne_10m_admin_1_states_provinces_lines', simplify)).flatMap((item) =>
          linesOf(item.geometry).map((line) => ({ mz: prop(item.properties, 'MIN_ZOOM'), line })),
        )
      : [];
  return { countries, countryLabels, lakes, coast, borders, rivers, admin1 };
}

async function readPlaces() {
  const places = (await readLayer('ne_10m_populated_places', 0)).map((item) => {
    const p = item.properties;
    const name = String(prop(p, 'NAME'));
    const fr = prop(p, 'NAME_FR');
    const en = prop(p, 'NAME_EN');
    const [lon, lat] = item.geometry.coordinates;
    return {
      n: name,
      ...(typeof fr === 'string' && fr !== '' && fr !== name ? { fr } : {}),
      ...(typeof en === 'string' && en !== '' && en !== name ? { en } : {}),
      lon: round(lon, 3),
      lat: round(lat, 3),
      pop: Number(prop(p, 'POP_MAX')) || 0,
      mz: Number(prop(p, 'MIN_ZOOM')),
      ...(prop(p, 'ADM0CAP') === 1 ? { cap: 1 } : {}),
    };
  });
  /* Les plus peuplées d'abord : l'ordre de placement des étiquettes. */
  return places.sort((a, b) => b.pop - a.pop || a.n.localeCompare(b.n));
}

/* -----------------------------------------------------------------------------
   Écriture.
   -------------------------------------------------------------------------- */

/** Un polygone quantifié, découpé au besoin ; `null` si l'extérieur disparaît. */
function encodePolygon(polygon, q, box) {
  const rings = [];
  for (const [index, ring] of polygon.entries()) {
    const encoded = quantize(box ? clipRing(ring, box) : ring, q, true);
    if (encoded) rings.push(encoded);
    else if (index === 0) return null;
  }
  return rings;
}

function encodeLines(lines, q, box) {
  return lines.flatMap((line) =>
    (box ? clipLine(line, box) : [line]).flatMap((piece) => {
      const encoded = quantize(piece, q, false);
      return encoded ? [encoded] : [];
    }),
  );
}

/** Le fichier d'un niveau, pour le monde entier (`box` absent) ou une tuile. */
function encodeFile(level, places, q, bbox, box) {
  const fillBox = box && [
    box[0] - FILL_MARGIN,
    box[1] - FILL_MARGIN,
    box[2] + FILL_MARGIN,
    box[3] + FILL_MARGIN,
  ];
  const countries = [...level.countries]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([id, polygons]) => {
      const r = polygons.flatMap((polygon) => {
        const encoded = encodePolygon(polygon, q, fillBox);
        return encoded ? [encoded] : [];
      });
      return r.length > 0 ? [{ id, r }] : [];
    });
  const lakes = level.lakes.flatMap((polygon) => {
    const encoded = encodePolygon(polygon, q, fillBox);
    return encoded ? [encoded] : [];
  });
  const withMinZoom = (items) =>
    items.flatMap(({ mz, line }) =>
      encodeLines([line], q, box).map((l) => ({ mz: round(Number(mz), 1), l })),
    );
  const inside = ({ lon, lat }) =>
    !box || (lon >= box[0] && lon < box[2] && lat > box[1] && lat <= box[3]);
  const file = {
    v: 1,
    q,
    bbox,
    countries,
    lakes,
    coast: encodeLines(level.coast, q, box),
    borders: encodeLines(level.borders, q, box),
    rivers: withMinZoom(level.rivers),
    ...(level.admin1.length > 0 ? { admin1: withMinZoom(level.admin1) } : {}),
    places: places.filter(inside),
    countryLabels: level.countryLabels.filter(inside),
  };
  const empty =
    file.countries.length + file.lakes.length + file.coast.length + file.borders.length === 0 &&
    file.rivers.length + (file.admin1?.length ?? 0) + file.places.length === 0;
  return empty ? null : file;
}

/**
 * Limite les entités d'un niveau à celles qui touchent une boîte : la tuile
 * ne découpe alors que ce qui la concerne.
 */
function touching(level, box) {
  const hits = (points) => {
    const [west, south, east, north] = boxOf(points);
    return west <= box[2] && east >= box[0] && south <= box[3] && north >= box[1];
  };
  return {
    countries: new Map(
      [...level.countries]
        .map(([id, polygons]) => [id, polygons.filter((polygon) => hits(polygon[0]))])
        .filter(([, polygons]) => polygons.length > 0),
    ),
    countryLabels: level.countryLabels,
    lakes: level.lakes.filter((polygon) => hits(polygon[0])),
    coast: level.coast.filter(hits),
    borders: level.borders.filter(hits),
    rivers: level.rivers.filter(({ line }) => hits(line)),
    admin1: level.admin1.filter(({ line }) => hits(line)),
  };
}

const serialize = (data) => `${JSON.stringify(data)}\n`;

export async function buildWorldData() {
  const places = await readPlaces();
  const outputs = new Map();

  for (const scale of ['110m', '50m']) {
    const level = await readLevel(scale);
    const { step, placesBelow } = LEVELS[scale];
    const file = encodeFile(
      level,
      places.filter((place) => place.mz < placesBelow),
      [-180, -90, step],
      [-180, -90, 180, 90],
    );
    outputs.set(`${scale}.json`, serialize(file));
  }

  const fine = await readLevel('10m');
  const tiles = [];
  for (let row = 0; row < 18; row += 1) {
    for (let col = 0; col < 36; col += 1) {
      const box = tileBox(col, row);
      const margin = [
        box[0] - FILL_MARGIN,
        box[1] - FILL_MARGIN,
        box[2] + FILL_MARGIN,
        box[3] + FILL_MARGIN,
      ];
      const file = encodeFile(
        touching(fine, margin),
        places,
        [box[0], box[1], LEVELS['10m'].step],
        box,
        box,
      );
      if (!file) continue;
      const key = tileKey(col, row);
      tiles.push(key);
      outputs.set(`10m/${key}.json`, serialize(file));
    }
  }

  outputs.set(
    'index.json',
    `${JSON.stringify(
      {
        version: 1,
        source: { name: 'Natural Earth', version: NATURAL_EARTH_VERSION },
        lods: {
          '110m': { file: '110m.json' },
          '50m': { file: '50m.json' },
          '10m': { tileDegrees: TILE_DEGREES, tiles },
        },
      },
      null,
      2,
    )}\n`,
  );

  const report = [...outputs]
    .filter(([name]) => name !== 'index.json')
    .map(([name, content]) => ({
      name,
      raw: Buffer.byteLength(content),
      gzip: gzipSync(content, { level: 9 }).length,
    }));
  const violations = checkBudgets(report);
  if (violations.length > 0) {
    throw new Error(`Budgets de poids dépassés :\n  - ${violations.join('\n  - ')}`);
  }

  /* Rien n'est écrit avant que tout tienne : pas de jeu à moitié remplacé. */
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(join(OUTPUT_DIR, '10m'), { recursive: true });
  for (const [name, content] of outputs) writeFileSync(join(OUTPUT_DIR, name), content);
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = await buildWorldData();
  const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);
  const tiles = report.filter((item) => item.name.startsWith('10m/'));
  for (const item of report.filter((entry) => !entry.name.startsWith('10m/'))) {
    console.log(`✓ ${item.name} : ${item.raw} o bruts, ${item.gzip} o gzip`);
  }
  const largest = tiles.reduce((max, item) => (item.raw > max.raw ? item : max), tiles[0]);
  console.log(
    `✓ 10m : ${tiles.length} tuiles, ${sum(tiles, 'raw')} o bruts, ${sum(tiles, 'gzip')} o gzip ; ` +
      `la plus lourde ${largest.name} (${largest.raw} o, ${largest.gzip} o gzip)`,
  );
}
