/* =============================================================================
   LE FORMAT DES DONNÉES DE `WorldMap` — `public/world-map/v1/`.

   Produit par `scripts/world-data.mjs` à partir de Natural Earth. Pas de
   TopoJSON : un JSON quantifié en deltas, que le navigateur décode en
   additionnant des entiers.

   - `index.json` décrit les trois niveaux : `110m.json`, `50m.json`, et les
     tuiles `10m/{col}_{row}.json` d'une grille de 10° × 10° (colonnes depuis
     −180°, rangées depuis le nord ; seules les cellules non vides existent).
   - Une ligne quantifiée `[x0, y0, dx1, dy1, …]` se lit avec la
     quantification `q = [ox, oy, pas]` du fichier :
     `longitude = ox + x × pas`, `latitude = oy + y × pas`, où `x` et `y` sont
     les sommes cumulées. Un anneau n'écrit pas son point de fermeture.
   - Les remplissages (`countries`, `lakes`) n'ont pas de contour : les côtes
     et les frontières viennent de `coast` et `borders`. Dans une tuile, les
     remplissages débordent de 0,05° pour que les tuiles voisines se
     recouvrent sans couture ; les lignes sont coupées au bord exact.

   Les fichiers viennent du réseau : ils sont VÉRIFIÉS avant usage, et une
   forme inattendue lève une `WorldDataError` au message neutre — jamais le
   contenu reçu.
   ========================================================================== */

/** `[x0, y0, dx1, dy1, …]`, entiers relatifs à la quantification du fichier. */
export type EncodedLine = readonly number[];
/** `[origine en longitude, origine en latitude, pas]`, en degrés. */
export type Quantization = readonly [originLon: number, originLat: number, step: number];

export interface WorldDataIndex {
  readonly version: 1;
  readonly source: { readonly name: 'Natural Earth'; readonly version: string };
  readonly lods: {
    readonly '110m': { readonly file: string };
    readonly '50m': { readonly file: string };
    readonly '10m': { readonly tileDegrees: 10; readonly tiles: readonly string[] /* "col_row" */ };
  };
}

export interface WorldDataCountry {
  /** ISO 3166-1 alpha-2, ou le code ADM0_A3 de Natural Earth pour un territoire sans code. */
  readonly id: string;
  /** Les polygones : `[anneau extérieur, …trous]`. */
  readonly r: readonly (readonly EncodedLine[])[];
}

export interface WorldDataRankedLine {
  /** Le `min_zoom` de Natural Earth : la ligne paraît à partir de ce zoom web. */
  readonly mz: number;
  readonly l: EncodedLine;
}

export interface WorldDataPlace {
  readonly n: string;
  readonly fr?: string;
  readonly en?: string;
  readonly lon: number;
  readonly lat: number;
  readonly pop: number;
  readonly mz: number;
  /** Capitale d'État. */
  readonly cap?: 1;
}

export interface WorldDataCountryLabel {
  readonly id: string;
  readonly lon: number;
  readonly lat: number;
  /** Zooms web entre lesquels Natural Earth pose l'étiquette. */
  readonly min: number;
  readonly max: number;
}

export interface WorldDataFile {
  readonly v: 1;
  readonly q: Quantization;
  readonly bbox: readonly [west: number, south: number, east: number, north: number];
  readonly countries: readonly WorldDataCountry[];
  readonly lakes?: readonly (readonly EncodedLine[])[];
  readonly coast: readonly EncodedLine[];
  readonly borders: readonly EncodedLine[];
  readonly rivers?: readonly WorldDataRankedLine[];
  readonly admin1?: readonly WorldDataRankedLine[];
  readonly places?: readonly WorldDataPlace[];
  readonly countryLabels?: readonly WorldDataCountryLabel[];
}

/** Des données de carte illisibles ou d'une forme inattendue. */
export class WorldDataError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'WorldDataError';
  }
}

/** Décode une ligne ou un anneau en degrés, à plat : `[lon0, lat0, lon1, lat1, …]`. */
export function decodeRing(line: EncodedLine, [ox, oy, step]: Quantization): Float64Array {
  const out = new Float64Array(line.length);
  let x = 0;
  let y = 0;
  for (let i = 0; i < line.length; i += 2) {
    x += line[i];
    y += line[i + 1];
    out[i] = ox + x * step;
    out[i + 1] = oy + y * step;
  }
  return out;
}

/* -----------------------------------------------------------------------------
   Vérification. Chaque garde lève une erreur au message fixe : ce qui est
   reçu n'est jamais recopié dans le message.
   -------------------------------------------------------------------------- */

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNumberTuple = (value: unknown, length: number): boolean =>
  Array.isArray(value) && value.length === length && value.every(isFiniteNumber);

function fail(what: string): never {
  throw new WorldDataError(`Données de carte invalides : ${what}.`);
}

/** Une ligne : au moins deux points, des entiers, en nombre pair. */
function isEncodedLine(value: unknown): value is EncodedLine {
  if (!Array.isArray(value) || value.length < 4 || value.length % 2 !== 0) return false;
  for (const item of value) if (!Number.isInteger(item)) return false;
  return true;
}

const isLineList = (value: unknown): value is EncodedLine[] =>
  Array.isArray(value) && value.every(isEncodedLine);

const isPolygonList = (value: unknown): boolean =>
  Array.isArray(value) && value.every((polygon) => isLineList(polygon) && polygon.length > 0);

const isRankedLine = (value: unknown): boolean =>
  isObject(value) && isFiniteNumber(value.mz) && isEncodedLine(value.l);

const isPlace = (value: unknown): boolean =>
  isObject(value) &&
  typeof value.n === 'string' &&
  (value.fr === undefined || typeof value.fr === 'string') &&
  (value.en === undefined || typeof value.en === 'string') &&
  isFiniteNumber(value.lon) &&
  isFiniteNumber(value.lat) &&
  isFiniteNumber(value.pop) &&
  isFiniteNumber(value.mz) &&
  (value.cap === undefined || value.cap === 1);

const isCountryLabel = (value: unknown): boolean =>
  isObject(value) &&
  typeof value.id === 'string' &&
  isFiniteNumber(value.lon) &&
  isFiniteNumber(value.lat) &&
  isFiniteNumber(value.min) &&
  isFiniteNumber(value.max);

const optionalList = (value: unknown, check: (item: unknown) => boolean) =>
  value === undefined || (Array.isArray(value) && value.every(check));

/** Vérifie un fichier de niveau (`110m.json`, `50m.json`, une tuile 10m). */
export function parseWorldDataFile(json: unknown): WorldDataFile {
  if (!isObject(json)) fail('fichier attendu');
  if (json.v !== 1) fail('version de fichier inconnue');
  if (!isNumberTuple(json.q, 3) || !((json.q as number[])[2] > 0)) fail('quantification');
  if (!isNumberTuple(json.bbox, 4)) fail('emprise');
  if (
    !Array.isArray(json.countries) ||
    !json.countries.every(
      (country: unknown) =>
        isObject(country) && typeof country.id === 'string' && isPolygonList(country.r),
    )
  ) {
    fail('pays');
  }
  if (json.lakes !== undefined && !isPolygonList(json.lakes)) fail('lacs');
  if (!isLineList(json.coast)) fail('côtes');
  if (!isLineList(json.borders)) fail('frontières');
  if (!optionalList(json.rivers, isRankedLine)) fail('fleuves');
  if (!optionalList(json.admin1, isRankedLine)) fail('limites régionales');
  if (!optionalList(json.places, isPlace)) fail('villes');
  if (!optionalList(json.countryLabels, isCountryLabel)) fail('étiquettes de pays');
  return json as unknown as WorldDataFile;
}

/* Un nom de fichier simple, sans dossier : l'index ne doit pas pouvoir faire
   charger autre chose que ce qui est à côté de lui. */
const FILE_NAME = /^[\w.-]+\.json$/;
const TILE_KEY = /^([0-9]|[12][0-9]|3[0-5])_([0-9]|1[0-7])$/;

/** Vérifie `index.json`. */
export function parseWorldDataIndex(json: unknown): WorldDataIndex {
  if (!isObject(json)) fail('index attendu');
  if (json.version !== 1) fail('version d’index inconnue');
  const source = json.source;
  if (!isObject(source) || source.name !== 'Natural Earth' || typeof source.version !== 'string') {
    fail('source de l’index');
  }
  const lods = json.lods;
  if (!isObject(lods)) fail('niveaux de l’index');
  for (const level of ['110m', '50m'] as const) {
    const entry = lods[level];
    if (!isObject(entry) || typeof entry.file !== 'string' || !FILE_NAME.test(entry.file)) {
      fail(`niveau ${level} de l’index`);
    }
  }
  const fine = lods['10m'];
  if (
    !isObject(fine) ||
    fine.tileDegrees !== 10 ||
    !Array.isArray(fine.tiles) ||
    !fine.tiles.every((key: unknown) => typeof key === 'string' && TILE_KEY.test(key))
  ) {
    fail('tuiles 10m de l’index');
  }
  return json as unknown as WorldDataIndex;
}
