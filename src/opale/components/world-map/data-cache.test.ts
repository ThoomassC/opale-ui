import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearWorldDataCache,
  coversPoint,
  MAX_CACHED_TILES,
  WorldDataSession,
  type LoadedLevel,
} from './data-cache';
import { WorldDataError, type WorldDataFile } from './data-format';

afterEach(() => {
  clearWorldDataCache();
  vi.restoreAllMocks();
});

/* =============================================================================
   LE CHARGEMENT DES DONNÉES, SANS RÉSEAU.

   `fetch` est simulé : chaque URL demandée attend qu'on la résolve, ce qui
   permet de faire arriver les réponses dans le désordre.
   ========================================================================== */

const BASE = 'https://example.test/app/';
const DATA = 'https://example.test/world-map/v1/';
const TILES = Array.from({ length: 80 }, (_, i) => `${i % 36}_${Math.floor(i / 36)}`);

const INDEX = {
  version: 1,
  source: { name: 'Natural Earth', version: '5.1.2' },
  lods: {
    '110m': { file: '110m.json' },
    '50m': { file: '50m.json' },
    '10m': { tileDegrees: 10, tiles: TILES },
  },
};

const file = (west: number): WorldDataFile => ({
  v: 1,
  q: [west, 0, 0.01],
  bbox: [west, 0, west + 10, 10],
  countries: [],
  coast: [],
  borders: [],
});

interface Pending {
  readonly url: string;
  readonly signal: AbortSignal | undefined;
  resolve(body: unknown, status?: number): void;
  reject(error: Error): void;
}

/** Un `fetch` dont on tient chaque réponse. */
function fakeNetwork() {
  const pending: Pending[] = [];
  const fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    return new Promise<Response>((resolve, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError')),
      );
      pending.push({
        url,
        signal: init?.signal ?? undefined,
        resolve: (body, status = 200) => resolve(new Response(JSON.stringify(body), { status })),
        reject,
      });
    });
  });
  const answer = async (url: string, body: unknown, status?: number) => {
    const request = pending.find((item) => item.url === url);
    if (!request) throw new Error(`Aucune requête vers ${url}`);
    pending.splice(pending.indexOf(request), 1);
    request.resolve(body, status);
    await flush();
  };
  const urls = () => fetch.mock.calls.map(([input]) => String(input));
  return { fetch, pending, answer, urls };
}

/** Laisse passer les promesses en attente. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function session(network: ReturnType<typeof fakeNetwork>, dataUrl = '../world-map/v1') {
  const loads: LoadedLevel[] = [];
  const errors: Error[] = [];
  const instance = new WorldDataSession(dataUrl, {
    base: BASE,
    fetch: network.fetch,
    onLoad: (level) => loads.push(level),
    onError: (error) => errors.push(error),
  });
  return { instance, loads, errors };
}

describe('WorldDataSession', () => {
  it('lit l’index puis le niveau demandé, à l’adresse absolue', async () => {
    const network = fakeNetwork();
    const { instance, loads } = session(network);
    instance.show('110m');
    await flush();
    expect(network.urls()).toEqual([`${DATA}index.json`]);
    await network.answer(`${DATA}index.json`, INDEX);
    expect(network.urls()).toEqual([`${DATA}index.json`, `${DATA}110m.json`]);
    await network.answer(`${DATA}110m.json`, file(0));
    expect(loads).toHaveLength(1);
    expect(loads[0].lod).toBe('110m');
    expect(loads[0].files).toEqual([file(0)]);
  });

  it('partage les requêtes entre deux cartes de la même adresse', async () => {
    const network = fakeNetwork();
    const a = session(network, '../world-map/v1/');
    const b = session(network, `${DATA}`);
    a.instance.show('110m');
    b.instance.show('110m');
    await flush();
    await network.answer(`${DATA}index.json`, INDEX);
    await network.answer(`${DATA}110m.json`, file(0));
    expect(network.fetch).toHaveBeenCalledTimes(2);
    expect(a.loads).toHaveLength(1);
    expect(b.loads).toHaveLength(1);
  });

  it('ignore la réponse d’un niveau dépassé, et abandonne sa requête', async () => {
    const network = fakeNetwork();
    const { instance, loads } = session(network);
    instance.show('50m');
    await flush();
    await network.answer(`${DATA}index.json`, INDEX);
    const fifty = network.pending.find((item) => item.url === `${DATA}50m.json`);
    instance.show('110m');
    await flush();
    expect(fifty?.signal?.aborted).toBe(true);
    await network.answer(`${DATA}110m.json`, file(0));
    expect(loads.map((level) => level.lod)).toEqual(['110m']);
  });

  it('ne charge que les tuiles qui existent, et les rend ensemble', async () => {
    const network = fakeNetwork();
    const { instance, loads } = session(network);
    instance.show('10m', ['0_0', '1_0', '35_17']);
    await flush();
    await network.answer(`${DATA}index.json`, INDEX);
    expect(network.urls().slice(1)).toEqual([`${DATA}10m/0_0.json`, `${DATA}10m/1_0.json`]);
    await network.answer(`${DATA}10m/1_0.json`, file(10));
    expect(loads).toHaveLength(0);
    await network.answer(`${DATA}10m/0_0.json`, file(0));
    expect(loads).toHaveLength(1);
    expect(loads[0].files).toEqual([file(0), file(10)]);
  });

  it('rend les tuiles reçues quand une autre échoue, et le signale', async () => {
    const network = fakeNetwork();
    const { instance, loads, errors } = session(network);
    instance.show('10m', ['0_0', '1_0', '35_17']);
    await flush();
    await network.answer(`${DATA}index.json`, INDEX);
    await network.answer(`${DATA}10m/1_0.json`, {}, 503);
    expect(loads).toHaveLength(0);
    await network.answer(`${DATA}10m/0_0.json`, file(0));

    expect(loads).toHaveLength(1);
    expect(loads[0].files).toEqual([file(0)]);
    expect(loads[0].tiles).toEqual(['0_0', '1_0', '35_17']);
    expect(loads[0].missing).toEqual(['1_0']);
    expect(errors).toHaveLength(1);
  });

  it('en cas d’échec : prévient une fois, ne réessaie pas, garde le niveau précédent', async () => {
    const network = fakeNetwork();
    const { instance, loads, errors } = session(network);
    instance.show('110m');
    await flush();
    await network.answer(`${DATA}index.json`, INDEX);
    await network.answer(`${DATA}110m.json`, file(0));
    instance.show('50m');
    await flush();
    await network.answer(`${DATA}50m.json`, { nope: true }, 500);
    await flush();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(WorldDataError);
    expect(errors[0].message).not.toContain('nope');
    expect(loads.map((level) => level.lod)).toEqual(['110m']);
    await flush();
    expect(network.urls().filter((url) => url.endsWith('50m.json'))).toHaveLength(1);
  });

  it('refuse un fichier mal formé', async () => {
    const network = fakeNetwork();
    const { instance, loads, errors } = session(network);
    instance.show('110m');
    await flush();
    await network.answer(`${DATA}index.json`, INDEX);
    await network.answer(`${DATA}110m.json`, { v: 1, q: 'oops' });
    expect(loads).toHaveLength(0);
    expect(errors[0]).toBeInstanceOf(WorldDataError);
  });

  it(`garde au plus ${MAX_CACHED_TILES} tuiles 10m, les moins récentes partent d’abord`, async () => {
    expect(MAX_CACHED_TILES).toBe(64);
    const network = fakeNetwork();
    const { instance } = session(network);
    instance.show('110m');
    await flush();
    await network.answer(`${DATA}index.json`, INDEX);
    for (const [i, key] of TILES.slice(0, 70).entries()) {
      instance.show('10m', [key]);
      await flush();
      await network.answer(`${DATA}10m/${key}.json`, file(i));
    }
    const fetched = () => network.urls().filter((url) => url.includes('/10m/')).length;
    expect(fetched()).toBe(70);
    instance.show('10m', [TILES[69]]);
    await flush();
    expect(fetched()).toBe(70);
    instance.show('10m', [TILES[0]]);
    await flush();
    expect(fetched()).toBe(71);
  });

  it('abandonne ses requêtes quand la carte disparaît', async () => {
    const network = fakeNetwork();
    const { instance, loads } = session(network);
    instance.show('110m');
    await flush();
    await network.answer(`${DATA}index.json`, INDEX);
    const request = network.pending.find((item) => item.url === `${DATA}110m.json`);
    instance.dispose();
    await flush();
    expect(request?.signal?.aborted).toBe(true);
    expect(loads).toHaveLength(0);
  });
});

describe('coversPoint', () => {
  const tiled = { lod: '10m', files: [], tiles: ['18_8', '19_8'], missing: ['19_8'] } as const;

  it('couvre le monde entier en 110m et 50m', () => {
    expect(coversPoint({ lod: '50m', files: [] }, 140, -35)).toBe(true);
  });

  it('en 10m, ne couvre que les tuiles demandées et reçues', () => {
    /* 18_8 : de 0° à 10° E, de 0° à 10° N. */
    expect(coversPoint(tiled, 5, 5)).toBe(true);
    expect(coversPoint(tiled, 15, 5)).toBe(false);
    expect(coversPoint(tiled, -60, -30)).toBe(false);
  });
});
