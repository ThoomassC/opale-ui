import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

describe('DocNav — groupes du sommaire', () => {
  it('affiche tous les groupes, ouverts au départ', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Sommaire' });

    expect(nav.querySelectorAll('.tc-doc-nav__group')).toHaveLength(NAV_SECTIONS.length);
    expect(within(nav).getAllByRole('button')).toHaveLength(NAV_SECTIONS.length);
    expect(
      within(nav)
        .getAllByRole('button')
        .every((button) => button.getAttribute('aria-expanded') === 'true'),
    ).toBe(true);
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

  it('relie chaque bouton à sa liste et replie un seul groupe à la fois', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Sommaire' });
    const priseEnMain = within(nav).getByRole('button', { name: 'PRISE EN MAIN' });
    const fondations = within(nav).getByRole('button', { name: 'FONDATIONS' });
    const list = document.getElementById(priseEnMain.getAttribute('aria-controls') ?? '');

    expect(priseEnMain.tagName).toBe('BUTTON');
    expect(list).not.toBeNull();
    expect(list).toHaveAttribute('aria-labelledby', priseEnMain.id);
    fireEvent.click(priseEnMain);
    expect(priseEnMain).toHaveAttribute('aria-expanded', 'false');
    expect(list).toHaveAttribute('hidden');
    expect(within(nav).queryByRole('link', { name: 'PageScaffold' })).not.toBeInTheDocument();
    expect(fondations).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(priseEnMain);
    expect(priseEnMain).toHaveAttribute('aria-expanded', 'true');
    expect(list).not.toHaveAttribute('hidden');
    expect(within(nav).getByRole('link', { name: 'PageScaffold' })).toBeVisible();
  });

  it('rouvre le groupe de la page courante sans rouvrir les autres', () => {
    const { rerender } = renderNav();
    const nav = screen.getByRole('navigation', { name: 'Sommaire' });
    const saisie = within(nav).getByRole('button', { name: 'SAISIE' });
    const fondations = within(nav).getByRole('button', { name: 'FONDATIONS' });

    fireEvent.click(saisie);
    fireEvent.click(fondations);
    rerender(<DocNav pages={PAGES} currentSlug="composants/opale-button" />);

    expect(saisie).toHaveAttribute('aria-expanded', 'true');
    expect(fondations).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).getByRole('link', { name: 'Button' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('place PageScaffold dans Prise en main, juste après Utilisation', () => {
    const first = NAV_SECTIONS[0];
    expect(first.id).toBe('prise-en-main');
    expect(first.entries.slice(0, 2).map(({ page }) => page.slug)).toEqual([
      'utilisation',
      'composants/page-scaffold',
    ]);
    expect(
      NAV_SECTIONS.flatMap((section) => section.entries).filter(
        ({ page }) => page.slug === 'composants/page-scaffold',
      ),
    ).toHaveLength(1);
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
    /* LES HUIT DOUBLONS ONT DISPARU, ET C'EST LE BUT. Chaque page de composant
       vendoré doublonnait celle de son jumeau Opale : un seul `Button`, un seul
       `Input`, un seul `Badge`… subsistent, dont la prop `liquidGlass` rend la
       matière de l'autre. Le garde vérifie donc les DEUX moitiés de chaque
       fusion — la page Opale est là, la page vendorée n'y est plus.

       LES DEUX ASSERTIONS SONT NÉCESSAIRES, et la seconde plus que la première.
       `navSectionsForPages` résout chaque slug de `OPALE_NAV_SECTIONS` par un
       `bySlug.get()` et SAUTE EN SILENCE ceux qu'aucune page ne sert : une
       entrée laissée en place après la suppression de sa page ne rend rien et
       ne rougit nulle part. C'est exactement ce qui est arrivé à
       `composants/button`, resté huit commits dans la liste sans que personne
       le voie. Seul un `not.toContain` sur le slug l'attrape. */
    const inputs = () => sectionFor('inputs')?.entries.map((entry) => entry.page.slug) ?? [];
    const affichage = () =>
      sectionFor('affichage-de-donnees')?.entries.map((entry) => entry.page.slug) ?? [];

    for (const [opale, vendore] of [
      ['composants/opale-button', 'composants/button'],
      ['composants/opale-input', 'composants/input'],
      ['composants/opale-checkbox', 'composants/checkbox'],
      ['composants/opale-slider', 'composants/slider'],
      ['composants/opale-select', 'composants/select'],
      /* Le seul dont les deux noms diffèrent : Opale appelle `Toggle` ce que le
         vendoré appelait `Switch`. Le doublon est bien le même. */
      ['composants/opale-toggle', 'composants/switch'],
    ] as const) {
      expect(inputs(), `${opale} devrait être servi`).toContain(opale);
      expect(inputs(), `${vendore} ne devrait plus être servi`).not.toContain(vendore);
    }

    for (const [opale, vendore] of [
      ['composants/opale-badge', 'composants/badge'],
      ['composants/opale-card', 'composants/card'],
    ] as const) {
      expect(affichage(), `${opale} devrait être servi`).toContain(opale);
      expect(affichage(), `${vendore} ne devrait plus être servi`).not.toContain(vendore);
    }

    /* `Toast` NE FUSIONNE PAS : le vendoré ne publie pas de composant `Toast`
       mais une file (`ToastProvider` + `useToast`) portaillée sur
       `document.body`, quand `Opale.Toast` est une notification rendue en
       place. C'était le LIBELLÉ qui doublonnait, d'où le renommage du slug —
       et les deux entrées restent servies, côte à côte. */
    expect(sectionFor('feedback')?.entries.map((entry) => entry.page.slug)).toEqual(
      expect.arrayContaining(['composants/opale-toast', 'composants/toast-provider']),
    );
    expect(sectionFor('feedback')?.entries.map((entry) => entry.page.slug)).not.toContain(
      'composants/toast',
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

/* ============================================================================
   LE SOMMAIRE SE REPLIE SUR TÉLÉPHONE.

   À 320 px, le rail permanent prenait 136 px et laissait 184 px au contenu :
   treize pages de composants débordaient encore à l'horizontale (WCAG 1.4.10).
   Sous 30 rem, le rail cède la place à un sommaire qu'on déplie. Le bouton
   existe toujours dans le DOM ; c'est la feuille qui ne le montre que sous
   30 rem (voir `doc-reflow.structure.test.ts`).
   ========================================================================== */
describe('le sommaire repliable', () => {
  const toggle = () => screen.getByRole('button', { name: 'Sommaire' });
  const shell = (container: HTMLElement) => container.querySelector('.tc-doc-nav');

  it('devrait démarrer replié, et dire ce qu’il commande', () => {
    const { container } = renderNav();

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    const controlled = document.getElementById(toggle().getAttribute('aria-controls') ?? '');
    expect(controlled, 'aria-controls doit viser un élément existant.').not.toBeNull();
    expect(shell(container)).toHaveAttribute('data-menu', 'closed');
  });

  it('devrait se déplier et se replier au clic', () => {
    const { container } = renderNav();

    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(shell(container)).toHaveAttribute('data-menu', 'open');

    fireEvent.click(toggle());
    expect(shell(container)).toHaveAttribute('data-menu', 'closed');
  });

  it('devrait conserver le choix de visibilité quand on change de page', () => {
    const { container, rerender } = renderNav();

    rerender(<DocNav pages={PAGES} currentSlug="installation" />);
    expect(shell(container)).toHaveAttribute('data-menu', 'closed');

    fireEvent.click(toggle());
    expect(shell(container)).toHaveAttribute('data-menu', 'open');

    rerender(<DocNav pages={PAGES} currentSlug="notes-de-versions" />);

    expect(shell(container)).toHaveAttribute('data-menu', 'open');
  });
});
