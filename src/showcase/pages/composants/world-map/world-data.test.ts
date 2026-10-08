import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import {
  BUDGETS,
  checkBudgets,
  clipLine,
  clipRing,
  NATURAL_EARTH_VERSION,
  OUTPUT_DIR,
  quantize,
  sha256,
  SOURCES,
  tileBox,
  tileKey,
  tilesCovering,
  type Position,
} from '../../../../../scripts/world-data.mjs';

/* =============================================================================
   LES DONNÉES DE LA CARTE DU MONDE, PRÉPARÉES HORS DU NAVIGATEUR.

   `scripts/world-data.mjs` télécharge Natural Earth (URL et empreintes
   épinglées), simplifie, découpe en tuiles et quantifie. Ce fichier vérifie
   ses fonctions pures, puis ce qu'il a écrit dans `public/world-map/v1/` :
   le jeu complet n'est pas reconstruit ici — les archives ne sont pas dans le
   dépôt — mais sa forme et ses budgets le sont.
   ========================================================================== */

/** Décode une ligne quantifiée en deltas, en degrés. */
function decode(line: readonly number[], [ox, oy, step]: readonly [number, number, number]) {
  const points: Position[] = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < line.length; i += 2) {
    x += line[i];
    y += line[i + 1];
    points.push([ox + x * step, oy + y * step]);
  }
  return points;
}

describe('quantize', () => {
  const q = [-180, -90, 0.01] as const;

  it('écrit un premier point absolu puis des deltas entiers, à un demi-pas près', () => {
    const line: Position[] = [
      [2.3522, 48.8566],
      [2.36, 48.9],
      [3.001, 47.5],
    ];
    const encoded = quantize(line, q, false);
    expect(encoded).not.toBeNull();
    expect(encoded?.every(Number.isInteger)).toBe(true);
    expect(encoded?.slice(0, 2)).toEqual([18235, 13886]);
    decode(encoded ?? [], q).forEach(([lon, lat], index) => {
      expect(Math.abs(lon - line[index][0])).toBeLessThanOrEqual(0.005 + 1e-9);
      expect(Math.abs(lat - line[index][1])).toBeLessThanOrEqual(0.005 + 1e-9);
    });
  });

  it('retire les points répétés et, pour un anneau, le point de fermeture', () => {
    const ring: Position[] = [
      [0, 0],
      [1, 0],
      [1.001, 0],
      [1, 1],
      [0, 0],
    ];
    expect(quantize(ring, q, true)).toEqual([18000, 9000, 100, 0, 0, 100]);
  });

  it('rend null pour ce qui ne dessine plus rien', () => {
    expect(
      quantize(
        [
          [0, 0],
          [0.001, 0.001],
        ],
        q,
        false,
      ),
    ).toBeNull();
    expect(
      quantize(
        [
          [0, 0],
          [1, 0],
          [0, 0],
        ],
        q,
        true,
      ),
    ).toBeNull();
  });
});

describe('clipRing', () => {
  const box = [0, 0, 10, 10] as const;

  it('garde intact un anneau entièrement dedans', () => {
    const ring: Position[] = [
      [1, 1],
      [2, 1],
      [2, 2],
    ];
    expect(clipRing(ring, box)).toEqual(ring);
  });

  it('rend un anneau vide quand il est entièrement dehors', () => {
    expect(
      clipRing(
        [
          [20, 20],
          [30, 20],
          [30, 30],
        ],
        box,
      ),
    ).toEqual([]);
  });

  it('coupe sur les bords de la boîte', () => {
    const clipped = clipRing(
      [
        [-5, 5],
        [5, 5],
        [5, 15],
        [-5, 15],
      ],
      box,
    );
    const sorted = [...clipped].map(([x, y]) => `${x},${y}`).sort();
    expect(sorted).toEqual(['0,10', '0,5', '5,10', '5,5']);
  });
});

describe('clipLine', () => {
  const box = [0, 0, 10, 10] as const;

  it('coupe une ligne qui traverse la boîte', () => {
    expect(
      clipLine(
        [
          [-5, 5],
          [15, 5],
        ],
        box,
      ),
    ).toEqual([
      [
        [0, 5],
        [10, 5],
      ],
    ]);
  });

  it('rend deux morceaux pour une ligne qui sort puis revient', () => {
    const pieces = clipLine(
      [
        [5, 5],
        [5, 15],
        [8, 15],
        [8, 5],
      ],
      box,
    );
    expect(pieces).toEqual([
      [
        [5, 5],
        [5, 10],
      ],
      [
        [8, 10],
        [8, 5],
      ],
    ]);
  });

  it('ne rend rien pour une ligne dehors', () => {
    expect(
      clipLine(
        [
          [-5, -5],
          [-1, -1],
        ],
        box,
      ),
    ).toEqual([]);
  });
});

describe('la grille des tuiles 10m', () => {
  it('numérote les colonnes depuis −180° et les rangées depuis le nord', () => {
    expect(tileKey(0, 0)).toBe('0_0');
    expect(tileBox(0, 0)).toEqual([-180, 80, -170, 90]);
    expect(tileBox(35, 17)).toEqual([170, -90, 180, -80]);
  });

  it('liste les tuiles qu’une boîte recouvre, bornées à la grille', () => {
    expect(tilesCovering([-1, -1, 1, 1]).map(([c, r]) => tileKey(c, r))).toEqual([
      '17_8',
      '18_8',
      '17_9',
      '18_9',
    ]);
    expect(tilesCovering([0, 0, 10, 10]).map(([c, r]) => tileKey(c, r))).toEqual(['18_8']);
    expect(tilesCovering([-200, -95, -175, -85])).toEqual([[0, 17]]);
  });
});

describe('les sources Natural Earth', () => {
  it('sont épinglées sur naciscdn.org, avec une empreinte SHA-256', () => {
    expect(NATURAL_EARTH_VERSION).toBe('5.1.2');
    for (const source of SOURCES) {
      expect(source.url).toBe(
        `https://naciscdn.org/naturalearth/${source.scale}/${source.theme}/${source.name}.zip`,
      );
      expect(source.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(new Set(SOURCES.map((source) => source.name)).size).toBe(SOURCES.length);
  });

  it('couvrent les couches de chaque niveau', () => {
    const names = SOURCES.map((source) => source.name);
    for (const scale of ['110m', '50m', '10m']) {
      for (const layer of [
        'admin_0_countries',
        'coastline',
        'admin_0_boundary_lines_land',
        'lakes',
        'rivers_lake_centerlines',
      ]) {
        expect(names).toContain(`ne_${scale}_${layer}`);
      }
    }
    expect(names).toContain('ne_10m_admin_1_states_provinces_lines');
    expect(names).toContain('ne_10m_populated_places');
  });

  it('calcule l’empreinte d’un contenu', () => {
    expect(sha256(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('checkBudgets', () => {
  it('signale chaque budget dépassé, et rien quand tout tient', () => {
    expect(
      checkBudgets([
        { name: '110m.json', raw: 1000, gzip: 500 },
        { name: '10m/0_0.json', raw: 1000, gzip: 500 },
      ]),
    ).toEqual([]);
    const violations = checkBudgets([
      { name: '110m.json', raw: BUDGETS['110m'].raw + 1, gzip: BUDGETS['110m'].gzip + 1 },
      { name: '50m.json', raw: 10, gzip: BUDGETS['50m'].gzip + 1 },
      { name: '10m/1_1.json', raw: BUDGETS.tile + 1, gzip: 1 },
    ]);
    expect(violations).toHaveLength(4);
    const many = Array.from({ length: 40 }, (_, index) => ({
      name: `10m/${index}_0.json`,
      raw: BUDGETS.tile,
      gzip: 1,
    }));
    expect(checkBudgets(many)).toHaveLength(1);
  });
});

/* -----------------------------------------------------------------------------
   Ce que le script a écrit.
   -------------------------------------------------------------------------- */

interface Index {
  readonly version: number;
  readonly source: { readonly name: string; readonly version: string };
  readonly lods: {
    readonly '110m': { readonly file: string };
    readonly '50m': { readonly file: string };
    readonly '10m': { readonly tileDegrees: number; readonly tiles: readonly string[] };
  };
}

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));

describe('public/world-map/v1 — relancez `node scripts/world-data.mjs` si ce bloc échoue', () => {
  it('a un index qui décrit les trois niveaux', () => {
    expect(existsSync(join(OUTPUT_DIR, 'index.json'))).toBe(true);
    const index = readJson(join(OUTPUT_DIR, 'index.json')) as Index;
    expect(index.version).toBe(1);
    expect(index.source).toEqual({ name: 'Natural Earth', version: NATURAL_EARTH_VERSION });
    expect(index.lods['110m'].file).toBe('110m.json');
    expect(index.lods['50m'].file).toBe('50m.json');
    expect(index.lods['10m'].tileDegrees).toBe(10);
  });

  it('liste exactement les tuiles écrites', () => {
    const index = readJson(join(OUTPUT_DIR, 'index.json')) as Index;
    const written = readdirSync(join(OUTPUT_DIR, '10m'))
      .map((file) => file.replace(/\.json$/, ''))
      .sort();
    expect([...index.lods['10m'].tiles].sort()).toEqual(written);
    expect(written.length).toBeGreaterThan(100);
    for (const key of written) expect(key).toMatch(/^([0-9]|[12][0-9]|3[0-5])_([0-9]|1[0-7])$/);
  });

  it('tient ses budgets de poids', () => {
    const files = [
      '110m.json',
      '50m.json',
      ...readdirSync(join(OUTPUT_DIR, '10m')).map((file) => `10m/${file}`),
    ].map((name) => {
      const path = join(OUTPUT_DIR, name);
      const raw = statSync(path).size;
      /* Le gzip ne compte que pour 110m et 50m : inutile de compresser 300 tuiles. */
      const gzip = name.startsWith('10m/') ? 0 : gzipSync(readFileSync(path), { level: 9 }).length;
      return { name, raw, gzip };
    });
    expect(checkBudgets(files)).toEqual([]);
  });

  it('dessine les pays, côtes et frontières dès le niveau le plus grossier', () => {
    const coarse = readJson(join(OUTPUT_DIR, '110m.json')) as {
      v: number;
      countries: { id: string }[];
      coast: unknown[];
      borders: unknown[];
      countryLabels: unknown[];
      places: unknown[];
    };
    expect(coarse.v).toBe(1);
    expect(coarse.countries.map((country) => country.id)).toEqual(
      expect.arrayContaining(['FR', 'BR', 'JP', 'AU']),
    );
    expect(coarse.coast.length).toBeGreaterThan(50);
    expect(coarse.borders.length).toBeGreaterThan(50);
    expect(coarse.countryLabels.length).toBeGreaterThan(100);
    expect(coarse.places.length).toBeGreaterThan(20);
  });
});
