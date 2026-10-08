/* =============================================================================
   LE CHARGEMENT DES DONNÉES DE `WorldMap`.

   - UN CACHE PAR MODULE, CLÉ = URL ABSOLUE. Deux cartes qui pointent vers
     les mêmes données, même écrites différemment (`./v1`, `/world-map/v1/`),
     partagent leurs requêtes et leurs fichiers : une promesse par URL.
   - Les tuiles 10m forment un LRU de 64 entrées ; seules partent celles que
     plus aucune carte n'affiche. L'index et les niveaux 110m et 50m restent.
   - Chaque requête a son `AbortController` : quand plus personne n'attend un
     fichier — la carte a changé de niveau, ou a disparu — elle est
     abandonnée.
   - Une réponse arrivée pour un niveau DÉPASSÉ est ignorée : seul le dernier
     `show` compte.
   - En cas d'échec, `onError` est appelée une fois par erreur, et rien
     n'est retenté automatiquement. Un niveau sans aucun fichier reçu laisse
     le précédent ; des tuiles 10m reçues se rendent même si une voisine a
     échoué (`missing`). Le fichier en échec reste en cache tant qu'une
     carte le demande. La carte affiche « Détails indisponibles ».

   Ce module ne lit `window` qu'à la construction d'une session — dans un
   effet, jamais au rendu.
   ========================================================================== */

import {
  parseWorldDataFile,
  parseWorldDataIndex,
  WorldDataError,
  type WorldDataFile,
  type WorldDataIndex,
} from './data-format';
import { tileKey, type Lod } from './lod';

/** Le plus de tuiles 10m gardées en mémoire. */
export const MAX_CACHED_TILES = 64;

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

interface Entry {
  readonly promise: Promise<unknown>;
  readonly controller: AbortController;
  readonly tile: boolean;
  refs: number;
  settled: boolean;
  failed: boolean;
}

interface Lease<T> {
  readonly promise: Promise<T>;
  release(): void;
}

const entries = new Map<string, Entry>();

/** Vide le cache et abandonne ce qui est en cours. Pour les tests, et pour réessayer à la main. */
export function clearWorldDataCache(): void {
  for (const entry of entries.values()) if (!entry.settled) entry.controller.abort();
  entries.clear();
}

/** Retire les tuiles les moins récemment demandées que plus personne n'affiche. */
function evict() {
  let tiles = 0;
  for (const entry of entries.values()) if (entry.tile) tiles += 1;
  for (const [url, entry] of entries) {
    if (tiles <= MAX_CACHED_TILES) break;
    if (entry.tile && entry.refs === 0 && entry.settled) {
      entries.delete(url);
      tiles -= 1;
    }
  }
}

async function download(fetchImpl: Fetch, url: string, signal: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(url, { signal, credentials: 'same-origin' });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new WorldDataError('Chargement des données de carte impossible.', { cause: error });
  }
  if (!response.ok) {
    throw new WorldDataError(
      `Chargement des données de carte impossible (HTTP ${response.status}).`,
    );
  }
  try {
    return await response.json();
  } catch (error) {
    if (signal.aborted) throw error;
    throw new WorldDataError('Données de carte illisibles.', { cause: error });
  }
}

/**
 * Prend une part d'un fichier : la promesse partagée de son contenu vérifié,
 * et de quoi la rendre. Le dernier à rendre une requête en cours l'abandonne.
 */
function acquire<T>(
  url: string,
  parse: (json: unknown) => T,
  tile: boolean,
  fetchImpl: Fetch,
): Lease<T> {
  let entry = entries.get(url);
  if (entry) {
    /* Le LRU suit l'ordre d'insertion : une entrée demandée repasse à la fin. */
    entries.delete(url);
    entries.set(url, entry);
  } else {
    const controller = new AbortController();
    const promise = download(fetchImpl, url, controller.signal).then(parse);
    const created: Entry = { promise, controller, tile, refs: 0, settled: false, failed: false };
    promise.then(
      () => {
        created.settled = true;
      },
      () => {
        created.settled = true;
        created.failed = true;
      },
    );
    entries.set(url, created);
    entry = created;
  }
  const held = entry;
  held.refs += 1;
  evict();
  let released = false;
  return {
    /* Le même URL est toujours lu par le même vérificateur : la promesse
       partagée a donc bien le type de `parse`. */
    promise: held.promise as Promise<T>,
    release: () => {
      if (released) return;
      released = true;
      held.refs -= 1;
      if (held.refs > 0) return;
      if (!held.settled || held.failed) {
        if (!held.settled) held.controller.abort();
        if (entries.get(url) === held) entries.delete(url);
      }
      evict();
    },
  };
}

export interface LoadedLevel {
  readonly lod: Lod;
  /** Un fichier pour 110m et 50m ; les tuiles reçues, dans l'ordre, pour 10m. */
  readonly files: readonly WorldDataFile[];
  /** En 10m : les tuiles demandées, qu'elles existent ou non (une cellule absente de l'index est de l'eau). */
  readonly tiles?: readonly string[];
  /** En 10m : les tuiles demandées qui ont échoué. */
  readonly missing?: readonly string[];
}

/**
 * Vrai si le niveau chargé sait ce qu'il y a en `(longitude, latitude)` :
 * 110m et 50m couvrent le monde ; en 10m, seules les tuiles demandées et
 * reçues. Hors de là, la carte ne peut pas dire « l'océan ».
 */
export function coversPoint(level: LoadedLevel, longitude: number, latitude: number): boolean {
  if (level.lod !== '10m') return true;
  const key = tileKey(
    Math.min(35, Math.max(0, Math.floor((longitude + 180) / 10))),
    Math.min(17, Math.max(0, Math.floor((90 - latitude) / 10))),
  );
  return (level.tiles ?? []).includes(key) && !(level.missing ?? []).includes(key);
}

export interface WorldDataSessionOptions {
  /** L'adresse contre laquelle résoudre `dataUrl` ; par défaut, celle de la page. */
  readonly base?: string;
  readonly fetch?: Fetch;
  readonly onLoad: (level: LoadedLevel) => void;
  readonly onError?: (error: Error) => void;
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

/**
 * Les données d'une carte : `show` demande un niveau, `onLoad` le rend
 * quand tous ses fichiers sont là — s'il est encore le dernier demandé.
 */
export class WorldDataSession {
  readonly #base: string;
  readonly #fetch: Fetch;
  readonly #options: WorldDataSessionOptions;
  readonly #index: Lease<WorldDataIndex>;
  readonly #reported = new WeakSet<object>();
  #leases: Lease<WorldDataFile>[] = [];
  #generation = 0;
  #disposed = false;

  constructor(dataUrl: string, options: WorldDataSessionOptions) {
    const directory = dataUrl.endsWith('/') ? dataUrl : `${dataUrl}/`;
    this.#base = new URL(directory, options.base ?? globalThis.location?.href).href;
    this.#fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.#options = options;
    this.#index = acquire(`${this.#base}index.json`, parseWorldDataIndex, false, this.#fetch);
  }

  /** Demande un niveau ; pour 10m, les tuiles `col_row` visibles. */
  show(lod: Lod, tiles: readonly string[] = []): void {
    if (this.#disposed) return;
    const generation = ++this.#generation;
    const current = () => generation === this.#generation && !this.#disposed;
    this.#index.promise.then(
      (index) => {
        if (!current()) return;
        const available = new Set(index.lods['10m'].tiles);
        const keys = tiles.filter((key) => available.has(key));
        const urls =
          lod === '10m'
            ? keys.map((key) => `${this.#base}10m/${key}.json`)
            : [`${this.#base}${index.lods[lod].file}`];
        /* Les nouvelles parts AVANT de rendre les anciennes : une tuile encore
           visible n'est ni abandonnée ni rechargée. */
        const leases = urls.map((url) =>
          acquire(url, parseWorldDataFile, lod === '10m', this.#fetch),
        );
        for (const lease of this.#leases) lease.release();
        this.#leases = leases;
        /* UNE TUILE EN ÉCHEC NE RETIENT PAS LES AUTRES : le niveau se rend
           avec ce qui est arrivé, et l'échec est signalé. Tout attendre
           gardait le niveau précédent — une autre région — tant que la
           tuile manquante restait en vue. */
        Promise.allSettled(leases.map((lease) => lease.promise)).then((results) => {
          if (!current()) return;
          const files: WorldDataFile[] = [];
          const missing: string[] = [];
          results.forEach((result, position) => {
            if (result.status === 'fulfilled') {
              files.push(result.value);
            } else {
              missing.push(keys[position] ?? lod);
              this.#report(result.reason);
            }
          });
          if (results.length > 0 && files.length === 0) return;
          this.#options.onLoad(
            lod === '10m' ? { lod, files, tiles: [...tiles], missing } : { lod, files },
          );
        });
      },
      (error: unknown) => {
        if (current()) this.#report(error);
      },
    );
  }

  /** Rend tout : les requêtes que plus personne n'attend sont abandonnées. */
  dispose(): void {
    this.#disposed = true;
    for (const lease of this.#leases) lease.release();
    this.#leases = [];
    this.#index.release();
  }

  #report(error: unknown) {
    if (isAbort(error)) return;
    const reported =
      error instanceof Error ? error : new WorldDataError('Données de carte indisponibles.');
    if (this.#reported.has(reported)) return;
    this.#reported.add(reported);
    this.#options.onError?.(reported);
  }
}
