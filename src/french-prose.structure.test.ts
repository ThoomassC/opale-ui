import { describe, expect, it } from 'vitest';

import { catalogCategoryLabel } from './showcase/catalog-category';
import { OPALE_NAV_SECTIONS } from './showcase/doc-model';
import { CATALOG } from './opale/catalog';

/* =============================================================================
   LA PROSE FRANÇAISE DIT « VERRE LIQUIDE ».

   Le matériau s'appelle « verre liquide » en français et `liquidGlass` dans le
   code. Le nom anglais en deux mots n'est pas un identifiant : c'est de la
   prose, et il n'a sa place que dans les traductions anglaises de
   `localization.ts` et de l'accueil (`pages/accueil/home-copy.ts`), seuls
   fichiers exclus du balayage.

   Le mot cherché est recomposé à l'exécution, pour que ce fichier ne se
   dénonce pas lui-même. `liquidGlass`, sans espace, ne correspond pas.
   ========================================================================== */

const ENGLISH_NAME = new RegExp(['liquid', 'glass'].join('\\s+'), 'i');

const SOURCES = {
  ...import.meta.glob(
    [
      './**/*.{ts,tsx,css,scss,md}',
      '!./**/*.test.{ts,tsx}',
      '!./showcase/localization.ts',
      '!./showcase/pages/accueil/home-copy.ts',
    ],
    { query: '?raw', import: 'default', eager: true },
  ),
  ...import.meta.glob('../README.md', { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>;

describe('le nom du matériau en français', () => {
  it('balaie bien les sources et le README', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
    expect(Object.keys(SOURCES)).toContain('../README.md');
  });

  it('écrit « verre liquide » partout où la prose est française', () => {
    const guilty = Object.entries(SOURCES).flatMap(([path, source]) =>
      source
        .split('\n')
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => ENGLISH_NAME.test(line))
        .map(({ line, index }) => `${path}:${index + 1} ${line.trim()}`),
    );

    expect(guilty, 'Écrivez « verre liquide » en prose, `liquidGlass` en code.').toEqual([]);
  });
});

/* =============================================================================
   LES FAMILLES DU CATALOGUE ET LES SECTIONS DU SOMMAIRE SONT EN FRANÇAIS.

   Les identifiants de section (`inputs`, `feedback`) et les adresses ne
   changent pas : ce sont des clés. Ce qui s'affiche, lui, est traduit, et une
   famille du catalogue porte le même nom que la section du sommaire qui la
   range.
   ========================================================================== */

const ENGLISH_LABELS = /\b(?:inputs?|feedback|layout|display|buttons?|map|other)\b/i;

describe('les libellés de navigation', () => {
  it('traduit chaque section du sommaire', () => {
    const labels = OPALE_NAV_SECTIONS.map((section) => section.label);
    expect(labels.filter((label) => ENGLISH_LABELS.test(label))).toEqual([]);
  });

  it('range chaque famille du catalogue sous une section de même nom', () => {
    const sections = new Set(OPALE_NAV_SECTIONS.map((section) => section.label));
    const families = [...new Set(CATALOG.map((entry) => catalogCategoryLabel(entry.category)))];

    expect(families.filter((family) => !sections.has(family.toUpperCase()))).toEqual([]);
  });

  it('ne nomme une entrée qu’en français ou par le nom de son composant', () => {
    const entries = OPALE_NAV_SECTIONS.flatMap((section) => section.entries);
    const prose = entries.filter((entry) => /\s/.test(entry.label));

    expect(prose.filter((entry) => ENGLISH_LABELS.test(entry.label))).toEqual([]);
  });
});
