import { describe, expect, it } from 'vitest';

import type { WorldDataFile } from './data-format';
import { countryAt, regionNamer } from './place';

/* Une quantification au degré : les lignes s'écrivent en degrés relatifs. */
const file = (countries: WorldDataFile['countries']): WorldDataFile => ({
  v: 1,
  q: [0, 0, 1],
  bbox: [-180, -90, 180, 90],
  countries,
  coast: [],
  borders: [],
});

/* Un carré de 10° troué en son centre d'un carré de 2°. */
const HOLED = file([
  {
    id: 'AA',
    r: [
      [
        [0, 0, 10, 0, 0, 10, -10, 0],
        [4, 4, 2, 0, 0, 2, -2, 0],
      ],
    ],
  },
  { id: 'BB', r: [[[20, 0, 5, 0, 0, 5, -5, 0]]] },
]);

describe('countryAt', () => {
  it('trouve le pays sous un point', () => {
    expect(countryAt([HOLED], 1, 1)).toBe('AA');
    expect(countryAt([HOLED], 22, 2)).toBe('BB');
  });

  it('ne trouve rien dans un trou ni en mer', () => {
    expect(countryAt([HOLED], 5, 5)).toBeUndefined();
    expect(countryAt([HOLED], 15, 2)).toBeUndefined();
  });

  it('cherche dans chaque fichier chargé', () => {
    const other = file([{ id: 'CC', r: [[[50, 50, 5, 0, 0, 5, -5, 0]]] }]);
    expect(countryAt([HOLED, other], 52, 52)).toBe('CC');
  });
});

describe('regionNamer', () => {
  it('nomme un code ISO dans la langue demandée', () => {
    expect(regionNamer('fr')('FR')).toBe('France');
    expect(regionNamer('en')('DE')).toBe('Germany');
  });

  it('ne nomme pas un code inconnu', () => {
    expect(regionNamer('fr')('not-a-code')).toBeUndefined();
  });
});
