import { describe, expect, it } from 'vitest';

import { declaration, declarations } from '../test/css-rules';
import { stripComments } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   UN SEUL ANNEAU DE FOCUS.

   L'audit en comptait cinq : 2 ou 3 px, décalés de -4 à 4 px, selon le
   composant. Les liens de SiteNav n'en avaient aucun — seule leur couleur
   changeait —, et SearchBar éteignait le halo du verre pour ne garder qu'un
   filet de bordure de 1 px.

   La règle : tout `outline` visible prend sa largeur dans
   `--opale-focus-ring-width` et son décalage dans `--opale-focus-ring-offset`
   (ou son opposé, pour un anneau intérieur). Seule la couleur varie : le bleu
   de focus, l'encre du verre ou `currentColor` sur un remplissage.
   ========================================================================== */

const modules = import.meta.glob('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };
const WIDTH = 'var(--opale-focus-ring-width)';
const OFFSETS = ['var(--opale-focus-ring-offset)', 'calc(var(--opale-focus-ring-width) * -1)'];

describe('l’anneau de focus', () => {
  it('déclare sa largeur et son décalage à la racine', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-focus-ring-width')).toBe('3px');
    expect(root.get('--opale-focus-ring-offset')).toBe('3px');
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const source = stripComments(raw);
    const outlines = [...source.matchAll(/(?<![\w-])outline:\s*([^;]+);/g)]
      .map((m) => m[1].trim())
      .filter((value) => !/^(none|0)$/.test(value));
    const offsets = [...source.matchAll(/outline-offset:\s*([^;]+);/g)].map((m) => m[1].trim());
    const name = file.replace('../opale/components/', '');

    if (outlines.length) {
      it(`${name} trace ses anneaux à la largeur commune`, () => {
        for (const value of outlines) expect(value.startsWith(`${WIDTH} solid `), value).toBe(true);
      });
    }
    if (offsets.length) {
      it(`${name} décale ses anneaux du pas commun`, () => {
        for (const value of offsets) expect(OFFSETS, value).toContain(value);
      });
    }
  }

  it('dessine un anneau sur les liens de SiteNav', () => {
    const css = modules['../opale/components/site-nav/site-nav.module.css'];
    expect(declaration(css, '.link:focus-visible', 'outline')).toMatch(
      /^var\(--opale-focus-ring-width\) solid /,
    );
  });

  it('dessine un anneau autour de SearchBar au clavier', () => {
    const css = modules['../opale/components/search-bar/style/SearchBar.module.scss'];
    expect(declaration(css, '.root:has(.input:focus-visible)', 'outline')).toMatch(
      /^var\(--opale-focus-ring-width\) solid /,
    );
  });
});

/* ============================================================================
   L'ANNEAU ÉPOUSE LA SILHOUETTE, IL NE TRACE PAS DE RECTANGLE.

   Un `outline` suit le `border-radius` de la boîte, jamais le `clip-path`
   d'un pseudo-élément. Les contrôles dont la forme est peinte par `::before`
   gardent une boîte à angles vifs : au clavier, un rectangle gris cernait
   la pilule de SearchBar, les points du Carousel, les onglets de Tabs, la
   marque et les contrôles d'en-tête de PageScaffold. Au focus seulement, la
   boîte prend un rayon — 0,68 r pour un squircle, comme `.opale-button` —,
   l'anneau le suit, et rien ne change au repos.
   ========================================================================== */
describe('l’anneau suit la forme du contrôle', () => {
  const SQUIRCLE = /^calc\(var\(--opale-squircle-radius(, [^)]+)?\) \* 0\.68\)$/;
  const cases: ReadonlyArray<[string, string, RegExp]> = [
    ['header-controls/HeaderControls.module.css', '.theme:focus-visible', SQUIRCLE],
    ['header-controls/HeaderControls.module.css', '.languageTrigger:focus-visible', SQUIRCLE],
    ['header-controls/HeaderControls.module.css', '.tab:focus-visible', SQUIRCLE],
    ['carousel/style/Carousel.module.css', '.dot:focus-visible', /^50%$/],
    ['tabs/style/Tabs.module.css', '.tabsTrigger:focus-visible', /^var\(--opale-tabs-radius\)$/],
    ['page-scaffold/PageScaffold.module.css', '.brand:focus-visible', /^var\(--opale-radius-sm\)$/],
  ];
  for (const [file, selector, expected] of cases) {
    it(`arrondit ${selector} (${file.split('/')[0]})`, () => {
      const css = modules[`../opale/components/${file}`];
      expect(declaration(css, selector, 'border-radius')).toMatch(expected);
    });
  }

  it('arrondit le lien texte, dont l’anneau cernait les mots d’un rectangle', () => {
    expect(declaration(opaleSource, '.opale-link:focus-visible', 'border-radius')).toBe(
      'var(--opale-radius-sm)',
    );
  });
});

/* LES CHAMPS DE SAISIE N'ONT PAS D'ANNEAU AU FOCUS — DEMANDE DU PROPRIÉTAIRE.
   Un anneau gris autour d'un champ qui change déjà de bordure faisait double
   emploi. Le focus d'un champ se lit à sa bordure, qui passe au primaire
   (6,6:1 sur la surface claire) : le repère reste visible (WCAG 2.4.7). */
describe('le focus des champs de saisie', () => {
  it('ne trace plus d’anneau autour d’Input, Select et Textarea', () => {
    expect(
      declaration(
        opaleSource,
        '.opale-input-shell:has(> .opale-input:focus-visible, > .opale-select:focus-visible)',
        'outline',
      ),
    ).toBeUndefined();
    expect(declaration(opaleSource, '.opale-input-shell:focus-within', 'border-color')).toBe(
      'var(--opale-primary)',
    );
  });

  it('ne trace plus d’anneau autour de MultiSelect', () => {
    expect(
      declaration(
        opaleSource,
        '.opale-multiselect:has(> .opale-multiselect__list:focus-visible)',
        'outline',
      ),
    ).toBeUndefined();
    expect(declaration(opaleSource, '.opale-multiselect:focus-within', 'border-color')).toBe(
      'var(--opale-primary)',
    );
  });

  it('ne trace plus d’anneau autour de SearchBar sur la surface pleine', () => {
    const css = modules['../opale/components/search-bar/style/SearchBar.module.scss'];
    expect(declaration(css, '.plain:has(.input:focus-visible)', 'outline')).toBe('none');
    expect(declaration(css, '.plain:focus-within', '--opale-search-border')).toBe(
      'var(--opale-primary)',
    );
  });
});
