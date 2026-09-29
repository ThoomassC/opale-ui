import { describe, expect, it } from 'vitest';

import { declarations, parseRules, stripComments } from '../test/css-rules';
import doc from './doc.css?raw';
import docV3 from './doc-v3.css?raw';

/* ============================================================================
   LA VITRINE SE REFLUE À 320 PX (WCAG 1.4.10).

   Mesuré au navigateur, à 320 px sur un chargement de téléphone : soixante-deux
   pages sur soixante-neuf défilaient à l'horizontale. jsdom ne calcule aucune
   mise en page, donc ce garde tient les RÈGLES qui ont supprimé chaque cause ;
   la mesure elle-même se refait au navigateur à chaque changement de scène.
   ========================================================================== */

const CSS = stripComments(docV3);

/* Les corps de toutes les règles qui nomment exactement `selector`, tous contextes confondus. */
const rule = (selector: string) =>
  parseRules(docV3)
    .filter((candidate) => candidate.selectors.includes(selector))
    .map((candidate) => candidate.body)
    .join('\n');

describe('la vitrine à 320 px', () => {
  it('devrait donner à la page de composant une piste qui peut rétrécir', () => {
    // Piste implicite = largeur minimale du contenu = la plus longue ligne de code.
    expect(rule('.tc-doc-opale-page')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  /* RESP-01 : le tableau de props (704 px de largeur minimale) remontait sa
     largeur à travers les pistes implicites du gabarit de fiche : soixante
     fiches sur soixante défilaient à l'horizontale de 320 à 1 024 px. */
  it.each(['.tc-doc-component-page', '.tc-doc-component-section'])(
    'devrait borner la piste de %s pour que le tableau défile dans son cadre',
    (selector) => {
      expect(declarations(docV3, selector).get('grid-template-columns')).toBe('minmax(0, 1fr)');
    },
  );

  it('devrait faire défiler le tableau dans son propre cadre', () => {
    expect(declarations(doc, '.tc-doc-tablewrap').get('overflow-x')).toBe('auto');
  });

  it('devrait couper un code en ligne trop long pour sa phrase', () => {
    expect(rule('.tc-doc-column :not(pre) > code')).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('devrait borner les cellules de scène à leur conteneur', () => {
    expect(rule('.tc-doc-stage__cell')).toMatch(/max-inline-size:\s*100%/);
  });

  it('devrait laisser passer à la ligne le commutateur de matériau', () => {
    expect(rule('.tc-doc-opale-material-toggle')).toMatch(/flex-wrap:\s*wrap/);
  });

  it('devrait couper un titre d’un seul mot plus large que l’écran', () => {
    expect(rule('.tc-doc-page__title')).toMatch(/overflow-wrap:\s*anywhere/);
  });
});

/* Le rail permanent laissait 184 px au contenu : sous 30 rem il cède la place
   à un sommaire repliable, au-dessus de la page. */
describe('le rail cède sous 30 rem', () => {
  const narrow = (() => {
    const start = CSS.search(/@media \(max-width: 30rem\)\s*\{\s*\.tc-doc-body/);
    return start < 0 ? '' : CSS.slice(start, start + 4000);
  })();

  it('devrait passer la coquille en une seule colonne, rail replié compris', () => {
    expect(narrow).toMatch(
      /\.tc-doc-body\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/,
    );
  });

  it('devrait masquer le sommaire replié et montrer le bouton', () => {
    expect(narrow).toMatch(
      /\.tc-doc-nav\[data-menu='closed'\] \.tc-doc-nav__glass\s*\{[^}]*display:\s*none/,
    );
    expect(narrow).toMatch(/\.tc-doc-nav__menu\s*\{[^}]*display:\s*flex/);
  });

  it('devrait cacher le bouton au-dessus de 30 rem', () => {
    expect(rule('.tc-doc-nav__menu')).toMatch(/display:\s*none/);
  });
});

/* =============================================================================
   LA BARRE DU HAUT SE MESURE ELLE-MÊME (RESP-02, RESP-07, RESP-14).

   Les bascules de la barre étaient des requêtes média en rem : elles se
   calculent sur la taille de police INITIALE, donc un zoom du texte seul à
   200 % laissait les onglets du bureau déborder de 150 px. Une requête de
   conteneur lit le rem courant.
   ========================================================================== */
describe('la barre du haut', () => {
  const TOPBAR = '@container tc-doc-topbar (max-width: 42rem)';

  it('devrait être un conteneur de requêtes', () => {
    expect(declarations(docV3, '.tc-doc-topbar').get('container')).toBe(
      'tc-doc-topbar / inline-size',
    );
  });

  it('devrait basculer vers le menu compact par une requête de conteneur', () => {
    expect(
      declarations(docV3, '.tc-doc-topbar__menu', {
        within: '@container tc-doc-topbar (max-width: 77.999rem)',
      }).get('display'),
    ).toBe('block');
    expect(CSS).not.toMatch(/@media \(max-width: 77\.999rem\)/);
  });

  it('devrait ancrer le panneau du menu à la barre, jamais hors de l’écran', () => {
    expect(declarations(docV3, '.tc-doc-topbar__menu', { within: TOPBAR }).get('position')).toBe(
      'static',
    );
    expect(
      declarations(docV3, '.tc-doc-topbar .tc-doc-topbar__bar', { within: TOPBAR }).get('position'),
    ).toBe('relative');
    const panel = declarations(docV3, '.tc-doc-topbar__menu-nav', { within: TOPBAR });
    expect(panel.get('min-width')).toBe('0');
    expect(panel.get('inline-size')).toMatch(/^min\(16rem, calc\(100% - /);
  });

  it('devrait masquer la pastille de version sur la barre la plus étroite', () => {
    expect(
      declarations(docV3, '.tc-doc-topbar__version', {
        within: '@container tc-doc-topbar (max-width: 23.75rem)',
      }).get('display'),
    ).toBe('none');
  });
});

/* =============================================================================
   LE RAIL COMPACT RESTE LISIBLE ET TOUCHABLE (RESP-05, RESP-06, RESP-12).
   ========================================================================== */
const rem = (value: string | undefined) => Number(/^([\d.]+)rem/.exec(value ?? '')?.[1] ?? NaN);

describe('le rail compact', () => {
  const COMPACT = '@media (max-width: 59.999rem)';

  it('devrait garder 12 px aux titres et 14 px aux liens', () => {
    expect(
      rem(declarations(docV3, '.tc-doc-nav__grouptitle', { within: COMPACT }).get('font-size')),
    ).toBeGreaterThanOrEqual(0.75);
    expect(
      rem(declarations(docV3, '.tc-doc-nav__link', { within: COMPACT }).get('font-size')),
    ).toBeGreaterThanOrEqual(0.875);
  });

  it('devrait laisser les libellés passer à la ligne plutôt que les tronquer', () => {
    expect(declarations(docV3, '.tc-doc-nav__link', { within: COMPACT }).get('white-space')).toBe(
      'normal',
    );
  });

  it('devrait garder au moins 12 px au titre de groupe, partout', () => {
    expect(declarations(docV3, '.tc-doc-nav__grouptitle').get('font')).toMatch(/ 0\.75rem\//);
    expect(
      rem(
        declarations(docV3, '.tc-doc-nav__grouptitle', {
          within: '@media (max-width: 30rem)',
        }).get('font-size'),
      ),
    ).toBeGreaterThanOrEqual(0.75);
  });

  it('devrait retirer la poignée et élargir la barre sous un pointeur grossier', () => {
    const COARSE = '@media (pointer: coarse)';
    expect(declarations(docV3, '.tc-doc-nav__resize', { within: COARSE }).get('display')).toBe(
      'none !important',
    );
    expect(
      rem(
        declarations(docV3, '.tc-doc-nav', { within: COARSE }).get('--tc-doc-nav-scrollbar-size'),
      ),
    ).toBeGreaterThanOrEqual(1.5);
    expect(declarations(docV3, '.tc-doc-nav__scrollbar').get('width')).toBe(
      'var(--tc-doc-nav-scrollbar-size)',
    );
  });
});

/* RESP-12 : `.tc-doc code` en `0.9em` se composait avec une légende de 12 px
   et tombait à 10,8 px. */
describe('le plancher de lecture', () => {
  it('devrait empêcher un code imbriqué de descendre sous 12 px', () => {
    expect(declarations(doc, '.tc-doc code').get('font-size')).toBe('max(0.9em, var(--text-xs))');
  });
});

/* RESP-11 : 110 à 155 caractères par ligne sur bureau. La mesure est le jeton
   `--measure` (66 ch) du texte courant : 70 ch laissaient encore 92 caractères
   sur la police de la vitrine. */
describe('la mesure de la prose', () => {
  it.each([
    '.tc-doc-release__change-list p',
    '.tc-doc-component-section__list',
    '.tc-doc-component-alternative__text',
  ])('devrait borner %s', (selector) => {
    expect(declarations(docV3, selector).get('max-inline-size')).toBe('var(--measure)');
  });

  it('devrait reprendre la mesure sur chaque engagement de la liste', () => {
    expect(declarations(doc, '.tc-doc-checklist li').get('max-inline-size')).toBe('var(--measure)');
  });
});
