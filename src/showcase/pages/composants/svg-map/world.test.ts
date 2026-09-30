import { describe, expect, it } from 'vitest';

import { pathBounds } from '../../../../opale/components/svg-map/path-bounds';
import { CONTINENT_FRAMES, countriesOf, WORLD_COUNTRIES, WORLD_VIEWBOX } from './world';

describe('la carte du monde de la démonstration', () => {
  /* LE JEU 50m, COMME TRAVELS IN WORLD : 241 formes, Antarctique retiré. Le
     110m n'en avait que 177 — ni Singapour, ni Malte, ni la plupart des
     îles. */
  it('dessine les formes du jeu 50m en 239 régions, Antarctique retiré', () => {
    expect(WORLD_VIEWBOX).toBe('0 0 960 500');
    /* 241 formes, moins l'Antarctique, moins Ashmore-et-Cartier réunie à
       l'Australie. */
    expect(WORLD_COUNTRIES).toHaveLength(239);
    expect(new Set(WORLD_COUNTRIES.map((country) => country.id)).size).toBe(239);
    for (const small of ['SG', 'MT', 'MU', 'BH']) {
      expect(
        WORLD_COUNTRIES.some((country) => country.id === small),
        small,
      ).toBe(true);
    }
  });

  /* La jointure passe par le numérique : « France » vient de l'ISO 250 et
     d'Intl.DisplayNames, pas du libellé anglais du jeu de données. */
  it('nomme les pays en français à partir de leur code ISO', () => {
    const byId = new Map(WORLD_COUNTRIES.map((country) => [country.id, country]));
    expect(byId.get('FR')?.name).toBe('France');
    expect(byId.get('DE')?.name).toBe('Allemagne');
    expect(byId.get('JP')?.name).toBe('Japon');
    expect(byId.get('FR')?.continent).toBe('europe');
  });

  /* Le 50m porte deux formes sous l'ISO 036 : l'Australie et les îles
     Ashmore-et-Cartier, territoire australien. Une région par code : sans
     fusion, deux boutons partageraient un identifiant, et la sélection comme
     le focus iraient au hasard. */
  it('réunit en une région les formes qui partagent un code ISO', () => {
    const australia = WORLD_COUNTRIES.filter((country) => country.id === 'AU');
    expect(australia).toHaveLength(1);
    expect(australia[0].name).toBe('Australie');
    expect((australia[0].path.match(/M/g) ?? []).length).toBeGreaterThan(1);
  });

  it('garde dessinées les cinq formes sans code ISO', () => {
    expect(WORLD_COUNTRIES.filter((country) => country.id.startsWith('sans-code'))).toHaveLength(5);
  });

  /* Natural Earth I dans son cadre d'usine : le monde tient dans 960 × 500,
     sans qu'aucun ajustement ne dépende des données. */
  it('borne chaque pays dans le cadre de la projection', () => {
    for (const country of WORLD_COUNTRIES) {
      const box = pathBounds(country.path);
      expect(box.minX, country.id).toBeGreaterThanOrEqual(0);
      expect(box.maxX, country.id).toBeLessThanOrEqual(960);
      expect(box.minY, country.id).toBeGreaterThanOrEqual(0);
      expect(box.maxY, country.id).toBeLessThanOrEqual(500);
    }
  });

  it('regroupe les pays par continent pour le cadrage', () => {
    expect(countriesOf('europe')).toContain('FR');
    expect(countriesOf('asia')).toContain('JP');
    expect(countriesOf('americas')).toContain('BR');
    expect(countriesOf('africa').length).toBeGreaterThan(40);
  });

  /* Le cadre de l'Europe doit être européen : cadrée sur ses pays, elle
     couvrait presque tout le planisphère (France et Guyane, Russie). */
  it('cadre l’Europe sur l’Europe, et non sur ses territoires lointains', () => {
    const europe = CONTINENT_FRAMES.europe;
    expect(europe.maxX - europe.minX).toBeLessThan(960 / 3);
    const france = pathBounds(WORLD_COUNTRIES.find((c) => c.id === 'FR')?.path ?? '');
    expect(france.maxY).toBeGreaterThan(europe.maxY);
  });
});
