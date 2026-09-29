import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { hrefFor } from '../doc-model';
import { COMPONENT_ALTERNATIVES } from './component-alternatives';
import { PAGES } from './index';
import { preloadPages } from './lazy-page';

/* =============================================================================
   UN SEUL GABARIT POUR TOUTES LES PAGES DE COMPOSANT.

   Chaque page du groupe « composants » rend ses sections sous les mêmes titres
   de niveau 2, dans le même ordre. Les sections « États » et « Limites
   connues » sont facultatives ; les autres sont obligatoires.

   Les titres rendus PAR LE COMPOSANT DÉMONTRÉ — un `Heading level={2}` dans la
   démo, par exemple — ne font pas partie du plan de la page : ils sont ignorés
   dès qu'ils vivent dans une scène.
   ========================================================================== */

const CANONICAL = [
  'Import',
  'Démo',
  'Exemples',
  'Props',
  'États',
  'Accessibilité',
  'Limites connues',
] as const;

const REQUIRED = ['Import', 'Démo', 'Exemples', 'Props', 'Accessibilité'] as const;

const LIVE_AREAS = '.tc-doc-component-demo, .tc-doc-specimen__stage';

const COMPONENT_PAGES = PAGES.filter((page) => page.group === 'composants').map(
  (page) => [page.slug, page] as const,
);

beforeAll(() => preloadPages());
afterEach(cleanup);

function pageHeadings(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll('h2')]
    .filter((heading) => !heading.closest(LIVE_AREAS))
    .map((heading) => heading.textContent?.trim() ?? '');
}

describe('le gabarit des pages de composant', () => {
  it('devrait couvrir toutes les pages du groupe composants', () => {
    expect(COMPONENT_PAGES.length).toBeGreaterThan(50);
  });

  it.each(COMPONENT_PAGES)(
    'la page « %s » devrait rendre ses sections dans l’ordre canonique',
    (_slug, page) => {
      const { container } = render(<>{page.render()}</>);
      const headings = pageHeadings(container);

      expect(headings).toEqual(CANONICAL.filter((title) => headings.includes(title)));
      for (const title of REQUIRED) expect(headings).toContain(title);
    },
  );

  it.each(COMPONENT_PAGES)(
    'la page « %s » devrait montrer un import nommé depuis le paquet',
    (_slug, page) => {
      const { container } = render(<>{page.render()}</>);
      const snippet = container.querySelector('[data-section="import"] pre')?.textContent ?? '';

      expect(snippet).toMatch(
        /^import \{ [A-Z]\w*(?:, [A-Za-z]\w*)* \} from '@thomascaron\/opale-ui';$/,
      );
    },
  );

  it.each(COMPONENT_PAGES)(
    'la page « %s » devrait décrire le clavier et les rôles',
    (_slug, page) => {
      const { container } = render(<>{page.render()}</>);
      const section = container.querySelector('[data-section="accessibilite"]');

      expect(section?.querySelectorAll('li').length ?? 0).toBeGreaterThan(0);
    },
  );

  /* L'ENCADRÉ « QUAND UTILISER X PLUTÔT QUE Y » précède les sections : il
     n'a pas de titre de niveau 2, donc il ne change pas le plan ci-dessus. */
  const ALTERNATIVES = Object.entries(COMPONENT_ALTERNATIVES);

  it('devrait tenir les composants voisins par paires réciproques', () => {
    expect(ALTERNATIVES.length).toBeGreaterThan(0);
    const slugs = new Set(PAGES.map((page) => page.slug));

    for (const [slug, alternative] of ALTERNATIVES) {
      expect(slugs.has(slug), `page absente : ${slug}`).toBe(true);
      expect(slugs.has(alternative.slug), `page absente : ${alternative.slug}`).toBe(true);
      expect(COMPONENT_ALTERNATIVES[alternative.slug]?.slug, `réciproque de ${slug}`).toBe(slug);
    }
  });

  it.each(ALTERNATIVES)(
    'la page « %s » devrait renvoyer vers son voisin avant les sections',
    (slug, alternative) => {
      const page = PAGES.find((candidate) => candidate.slug === slug);
      const { container } = render(<>{page?.render()}</>);
      const box = container.querySelector('.tc-doc-component-alternative');
      const link = box?.querySelector('a');

      expect(box?.textContent).toMatch(
        new RegExp(`^Quand utiliser ${alternative.name} plutôt que`),
      );
      expect(link?.getAttribute('href')).toBe(hrefFor(alternative.slug));
      expect(link?.textContent).toContain(alternative.name);

      const importSection = container.querySelector('[data-section="import"]');
      expect(
        box && importSection && box.compareDocumentPosition(importSection) & 4,
        'l’encadré précède la section Import',
      ).toBeTruthy();
    },
  );
});
