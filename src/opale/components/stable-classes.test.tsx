import { act, cleanup, render } from '@testing-library/react';
import { useEffect, type ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import Modal from './modal/Modal';
import { PageScaffold } from './page-scaffold/PageScaffold';
import SearchBar from './search-bar/SearchBar';
import Sidebar from './sidebar/Sidebar';
import { SiteNav } from './site-nav/site-nav';
import Tabs from './tabs/Tabs';
import { ToastProvider, useToast } from './toast';
import Topbar from './topbar/Topbar';

/* =============================================================================
   LES CLASSES STABLES, NOMMABLES DEPUIS UNE FEUILLE D'HÔTE.

   Les classes d'un module CSS sont hachées à la compilation : aucune feuille
   d'hôte ne peut les viser. Chaque racine et chaque partie qui compte porte
   donc AUSSI une classe `opale-*` non hachée, dans les deux matières. La
   classe du module reste à côté : l'élément en porte au moins deux.
   ========================================================================== */

afterEach(cleanup);

function ShowToast() {
  const { showToast } = useToast();
  useEffect(() => {
    showToast({ title: 'Titre', description: 'Détail', duration: Infinity });
  }, [showToast]);
  return null;
}

type Case = {
  readonly name: string;
  readonly render: (liquidGlass: boolean) => ReactElement;
  readonly classes: readonly string[];
};

const CASES: readonly Case[] = [
  {
    name: 'Modal',
    render: (liquidGlass) => (
      <Modal
        open
        liquidGlass={liquidGlass}
        title="Titre"
        description="Détail"
        footer={<span>Pied</span>}
        onOpenChange={() => {}}
      >
        Corps
      </Modal>
    ),
    classes: [
      'opale-modal',
      'opale-modal__backdrop',
      'opale-modal__shell',
      'opale-modal__panel',
      'opale-modal__header',
      'opale-modal__heading',
      'opale-modal__title',
      'opale-modal__description',
      'opale-modal__close',
      'opale-modal__body',
      'opale-modal__footer',
    ],
  },
  {
    name: 'Tabs',
    render: (liquidGlass) => (
      <Tabs defaultValue="a" liquidGlass={liquidGlass}>
        <Tabs.List>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Contenu A</Tabs.Content>
      </Tabs>
    ),
    classes: [
      'opale-tabs',
      'opale-tabs__shell',
      'opale-tabs__list',
      'opale-tabs__indicator',
      'opale-tabs__trigger',
      'opale-tabs__trigger-shell',
      'opale-tabs__content',
    ],
  },
  {
    name: 'Sidebar',
    render: (liquidGlass) => (
      <Sidebar collapsible liquidGlass={liquidGlass}>
        <Sidebar.Header>
          <Sidebar.Toggle />
        </Sidebar.Header>
        <Sidebar.Items>
          <Sidebar.Item itemId="a" icon={<span>i</span>} badge={3}>
            A
          </Sidebar.Item>
        </Sidebar.Items>
        <Sidebar.Footer>Pied</Sidebar.Footer>
      </Sidebar>
    ),
    classes: [
      'opale-sidebar',
      'opale-sidebar__shell',
      'opale-sidebar__header',
      'opale-sidebar__items',
      'opale-sidebar__item',
      'opale-sidebar__item-icon',
      'opale-sidebar__item-label',
      'opale-sidebar__badge',
      'opale-sidebar__footer',
      'opale-sidebar__toggle',
    ],
  },
  {
    name: 'Topbar',
    render: (liquidGlass) => (
      <Topbar liquidGlass={liquidGlass}>
        <Topbar.Brand icon={<span>o</span>} title="Opale" subtitle="Système" />
        <Topbar.Section grow>Section</Topbar.Section>
        <Topbar.Divider />
        <Topbar.Actions>Actions</Topbar.Actions>
      </Topbar>
    ),
    classes: [
      'opale-topbar',
      'opale-topbar__shell',
      'opale-topbar__brand',
      'opale-topbar__brand-icon',
      'opale-topbar__brand-title',
      'opale-topbar__brand-subtitle',
      'opale-topbar__section',
      'opale-topbar__divider',
      'opale-topbar__actions',
    ],
  },
  {
    name: 'ToastProvider',
    render: (liquidGlass) => (
      <ToastProvider liquidGlass={liquidGlass}>
        <ShowToast />
      </ToastProvider>
    ),
    classes: [
      'opale-toast-provider',
      'opale-toast-provider__stack',
      'opale-toast-provider__region',
      'opale-toast-provider__card',
      'opale-toast-provider__surface',
      'opale-toast-provider__body',
      'opale-toast-provider__title',
      'opale-toast-provider__description',
      'opale-toast-provider__close',
    ],
  },
  {
    name: 'SearchBar',
    render: (liquidGlass) => <SearchBar liquidGlass={liquidGlass} />,
    classes: [
      'opale-search-bar',
      'opale-search-bar__shell',
      'opale-search-bar__icon',
      'opale-search-bar__input',
    ],
  },
  {
    name: 'SiteNav',
    render: (liquidGlass) => (
      <SiteNav
        liquidGlass={liquidGlass}
        brand={<span>Opale</span>}
        items={[
          { id: 'a', href: '/a', label: 'A' },
          { id: 'b', href: '/b', label: 'B' },
        ]}
        value="a"
      />
    ),
    classes: [
      'opale-site-nav',
      'opale-site-nav__shell',
      'opale-site-nav__brand',
      'opale-site-nav__list',
      'opale-site-nav__link',
      'opale-site-nav__bubble',
    ],
  },
  {
    name: 'PageScaffold',
    render: (liquidGlass) => (
      <PageScaffold
        liquidGlass={liquidGlass}
        copyrightYear={2026}
        showSkipLink
        searchProps={{ defaultValue: 'Al' }}
        searchSuggestions={[{ id: 'a', label: 'Alpha', href: '/alpha' }]}
      >
        Contenu
      </PageScaffold>
    ),
    classes: [
      'opale-page-scaffold',
      'opale-page-scaffold__skip-link',
      'opale-page-scaffold__header',
      'opale-page-scaffold__header-shell',
      'opale-page-scaffold__brand',
      'opale-page-scaffold__search',
      'opale-page-scaffold__suggestions',
      'opale-page-scaffold__suggestion',
      'opale-page-scaffold__navigation',
      'opale-page-scaffold__menu-button',
      'opale-page-scaffold__mobile-navigation',
      'opale-page-scaffold__actions',
      'opale-page-scaffold__main',
      'opale-page-scaffold__intro',
      'opale-page-scaffold__footer',
      'opale-page-scaffold__footer-links',
      'opale-page-scaffold__copyright',
    ],
  },
];

const ROWS = CASES.flatMap((entry) =>
  [false, true].flatMap((liquidGlass) =>
    entry.classes.map((className) => ({
      component: entry.name,
      material: liquidGlass ? 'verre' : 'pleine',
      liquidGlass,
      className,
      render: entry.render,
    })),
  ),
);

describe('les classes stables des composants', () => {
  it.each(ROWS)(
    '$component ($material) pose .$className à côté de sa classe de module',
    ({ liquidGlass, className, render: renderCase }) => {
      render(renderCase(liquidGlass));
      /* Les toasts naissent dans un effet. */
      act(() => {});

      const elements = document.body.querySelectorAll(`.${className}`);
      expect(elements.length).toBeGreaterThan(0);
      for (const element of elements) {
        expect(element.classList.length).toBeGreaterThan(1);
      }
    },
  );

  it('ne réutilise aucune classe que la feuille globale déclare déjà', async () => {
    const { default: sheet } = await import('../opale.css?raw');
    const taken = CASES.flatMap((entry) => entry.classes).filter((name) =>
      new RegExp(`\\.${name}(?![\\w-])`).test(sheet),
    );
    expect(taken).toEqual([]);
  });
});
