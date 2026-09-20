import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DocNav } from './doc-nav';
import { HOME_SLUG, hrefFor, navSectionsForPages } from './doc-model';
import { PAGES } from './pages';
import { UI_VERSION } from './version';

afterEach(cleanup);

function renderNav(currentSlug: string = HOME_SLUG) {
  return render(<DocNav pages={PAGES} currentSlug={currentSlug} />);
}

const NAV_SECTIONS = navSectionsForPages(PAGES);

describe('DocNav — rail permanent et statique', () => {
  it('devrait afficher tous les groupes sans contrôle de pliage', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Sommaire' });

    expect(nav.querySelectorAll('.tc-doc-nav__group')).toHaveLength(NAV_SECTIONS.length);
    expect(nav.querySelector('details')).toBeNull();
    expect(nav.querySelector('summary')).toBeNull();
    expect(nav.querySelector('button')).toBeNull();
    expect(document.querySelector('.tc-doc-nav__scroll')).not.toBeNull();
    expect(document.querySelector('.tc-doc-nav__scrollbar')).not.toBeNull();
  });

  it('devrait garder les trois onglets du header hors du sommaire', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Sommaire' });
    const links = within(nav).getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(hrefs).not.toContain(hrefFor(''));
    expect(hrefs).not.toContain(hrefFor('installation'));
    expect(hrefs).not.toContain(hrefFor('notes-de-versions'));
    expect(nav).not.toHaveTextContent('Installation');
    expect(nav).not.toHaveTextContent('Notes de versions');
  });

  it('devrait rendre les libellés de section comme du texte statique', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Sommaire' });

    for (const section of NAV_SECTIONS) {
      const title = nav.querySelector('#tc-doc-nav-section-' + section.id);

      expect(title).not.toBeNull();
      expect(title).toHaveTextContent(section.label);
      expect(title?.tagName).toBe('DIV');
    }
  });

  it('devrait garder une seule page courante dans le rail', () => {
    renderNav('composants/opale-button');

    const nav = screen.getByRole('navigation', { name: 'Sommaire' });
    const currentLinks = nav.querySelectorAll('[aria-current="page"]');

    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAttribute('href', hrefFor('composants/opale-button'));
  });

  it('devrait regrouper les pages historiques par famille sans catégorie Opale', () => {
    const sections = navSectionsForPages(PAGES);
    const sectionFor = (id: string) => sections.find((section) => section.id === id);

    expect(sections.map((section) => section.id)).not.toContain('opale');
    expect(sectionFor('fondations')?.entries.map((entry) => entry.page.slug)).toEqual([
      'palette',
      'espacement',
      'elevation',
      'verre',
      'verre-liquide',
      'accessibilite',
    ]);
    /* `composants/button` A DISPARU, ET C'EST LE BUT. La page du bouton vendoré
       doublonnait celle du bouton Opale : un seul `Button` subsiste, dont la
       prop `liquidGlass` rend la matière de l'autre. Le garde vise donc un
       historique qui, lui, n'a pas d'équivalent Opale. */
    expect(sectionFor('inputs')?.entries.map((entry) => entry.page.slug)).toContain(
      'composants/opale-button',
    );
    expect(sectionFor('inputs')?.entries.map((entry) => entry.page.slug)).not.toContain(
      'composants/button',
    );
    expect(sectionFor('affichage-de-donnees')?.entries.map((entry) => entry.page.slug)).toContain(
      'composants/card',
    );
    expect(sectionFor('feedback')?.entries.map((entry) => entry.page.slug)).toContain(
      'composants/modal',
    );
    expect(sectionFor('navigation')?.entries.map((entry) => entry.page.slug)).toContain(
      'composants/sidebar',
    );
  });

  it('devrait conserver la version en tête du sommaire', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Sommaire' });
    const version = screen.getByText('v' + UI_VERSION);

    expect(nav.firstElementChild).toContainElement(version);
  });
});
