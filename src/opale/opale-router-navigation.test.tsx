import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BreadcrumbLabels, NavItem, SelectionBarLabels } from '.';
import { Breadcrumb, Menu, Navbar, SelectionBar } from './opale';

/* =============================================================================
   LE ROUTEUR DE L'APPLICATION BRANCHÉ SUR LES LIENS D'OPALE (DX-02).

   Un seul contrat pour tous : `onNavigate(item, event)` reçoit un clic gauche
   simple, APRÈS que le composant a annulé la navigation native ; un clic
   modifié, du milieu ou vers un autre onglet reste au navigateur.
   ========================================================================== */

afterEach(cleanup);

/* Écouté sur le document, donc après React : on lit la décision des
   composants, puis on annule pour que jsdom ne tente pas de naviguer. */
let nativeNavigation: boolean[] = [];
const recordDefault = (event: Event) => {
  nativeNavigation.push(!event.defaultPrevented);
  event.preventDefault();
};
beforeEach(() => {
  nativeNavigation = [];
  document.addEventListener('click', recordDefault);
});
afterEach(() => document.removeEventListener('click', recordDefault));

const ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Accueil', href: '/' },
  { id: 'docs', label: 'Documentation', href: '/docs' },
  { id: 'help', label: 'Aide' },
];

describe('Navbar — onNavigate', () => {
  it('devrait remettre un clic simple sur un lien au routeur, sans navigation native', () => {
    const onNavigate = vi.fn();
    render(<Navbar items={ITEMS} value="home" onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Documentation' }));

    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(ITEMS[1], expect.any(Object));
    expect(nativeNavigation).toEqual([false]);
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
    ['le bouton du milieu', { button: 1 }],
  ])('devrait laisser au navigateur un clic avec %s', (_name, init) => {
    const onNavigate = vi.fn();
    render(<Navbar items={ITEMS} value="home" onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Documentation' }), init);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(nativeNavigation).toEqual([true]);
  });

  it('devrait garder la navigation native sans onNavigate', () => {
    render(<Navbar items={ITEMS} value="home" />);

    fireEvent.click(screen.getByRole('link', { name: 'Documentation' }));

    expect(nativeNavigation).toEqual([true]);
  });

  it('devrait retenir le lien routé en mode non contrôlé, sans appeler onValueChange', () => {
    const onValueChange = vi.fn();
    render(
      <Navbar
        items={ITEMS}
        defaultValue="home"
        onValueChange={onValueChange}
        onNavigate={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Documentation' }));

    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute('aria-current');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('ne devrait pas appeler onNavigate depuis une entrée bouton', () => {
    const onNavigate = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Navbar items={ITEMS} value="home" onNavigate={onNavigate} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Aide' }));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('help');
  });
});

describe('Menu — onNavigate', () => {
  it('devrait transmettre onNavigate à ses liens, puis se refermer et rendre le focus au sommaire', () => {
    const onNavigate = vi.fn();
    const { container } = render(<Menu open items={ITEMS} onNavigate={onNavigate} />);
    const details = container.querySelector('details');

    fireEvent.click(screen.getByRole('link', { name: 'Documentation' }));

    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(ITEMS[1], expect.any(Object));
    expect(nativeNavigation).toEqual([false]);
    expect(details).not.toHaveAttribute('open');
    expect(container.querySelector('summary')).toHaveFocus();
  });

  it('devrait rester ouvert sur un clic modifié, laissé au navigateur', () => {
    const onNavigate = vi.fn();
    const { container } = render(<Menu open items={ITEMS} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Documentation' }), { metaKey: true });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(container.querySelector('details')).toHaveAttribute('open');
  });
});

describe('Breadcrumb — onNavigate', () => {
  const TRAIL: readonly NavItem[] = [
    { id: 'home', label: 'Accueil', href: '/' },
    { id: 'docs', label: 'Documentation', href: '/docs' },
    { id: 'here', label: 'Navbar' },
  ];

  it('devrait remettre un clic simple au routeur', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumb items={TRAIL} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Documentation' }));

    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(TRAIL[1], expect.any(Object));
    expect(nativeNavigation).toEqual([false]);
  });

  it('devrait laisser un clic avec Maj au navigateur', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumb items={TRAIL} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Accueil' }), { shiftKey: true });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(nativeNavigation).toEqual([true]);
  });
});

describe('les textes de navigation.tsx (DX-09)', () => {
  it('Breadcrumb devrait garder « Fil d’Ariane » par défaut et suivre labels.navigation', () => {
    const { rerender } = render(<Breadcrumb items={ITEMS} />);
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane" })).toBeInTheDocument();

    const labels: Partial<BreadcrumbLabels> = { navigation: 'Breadcrumb' };
    rerender(<Breadcrumb items={ITEMS} labels={labels} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('Breadcrumb devrait faire gagner aria-label sur labels.navigation', () => {
    render(<Breadcrumb items={ITEMS} labels={{ navigation: 'Breadcrumb' }} aria-label="Chemin" />);
    expect(screen.getByRole('navigation', { name: 'Chemin' })).toBeInTheDocument();
  });

  it('SelectionBar devrait garder son compte français par défaut', () => {
    const { container, rerender } = render(<SelectionBar selectedCount={1} />);
    const live = () => within(container).getByText(/sélectionné|selected/);
    expect(live()).toHaveTextContent('1 sélectionné');

    rerender(<SelectionBar selectedCount={3} />);
    expect(live()).toHaveTextContent('3 sélectionnés');
  });

  it('SelectionBar devrait suivre labels.count', () => {
    const labels: Partial<SelectionBarLabels> = { count: (count) => `${count} selected` };
    const { container } = render(<SelectionBar selectedCount={2} labels={labels} />);

    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent('2 selected');
  });
});
