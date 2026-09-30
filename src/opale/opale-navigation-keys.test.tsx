import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette, Menu } from './opale';

afterEach(cleanup);

/* =============================================================================
   LA COMMANDE ACTIVE RESTE À L'ÉCRAN (ACC-05, WCAG 2.4.7 / 2.4.11).

   En `aria-activedescendant`, le focus reste dans la recherche : l'option
   active n'en est que la marque visuelle. Sans défilement, douze flèches
   plus bas elle était hors champ, et l'on ne savait plus ce qu'Entrée lancerait.
   ========================================================================== */
describe('CommandPalette : l’option active est ramenée dans la vue', () => {
  const scrollIntoView = vi.fn();
  beforeEach(() => {
    scrollIntoView.mockClear();
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
  });
  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  });

  const ITEMS = Array.from({ length: 30 }, (_, index) => ({
    id: `c${index}`,
    label: `Commande ${index}`,
  }));

  it('fait défiler l’option désignée par les flèches, au plus près', () => {
    render(<CommandPalette open onOpenChange={() => {}} items={ITEMS} />);
    const search = screen.getByRole('combobox');

    for (let step = 0; step < 12; step += 1) fireEvent.keyDown(search, { key: 'ArrowDown' });

    const activeId = search.getAttribute('aria-activedescendant');
    const option = screen.getByRole('option', { name: 'Commande 12' });
    expect(option.id).toBe(activeId);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest' });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(option);
  });

  it('tient sans `scrollIntoView` (jsdom, vieux navigateurs)', () => {
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    render(<CommandPalette open onOpenChange={() => {}} items={ITEMS} />);
    const search = screen.getByRole('combobox');

    expect(() => fireEvent.keyDown(search, { key: 'ArrowUp' })).not.toThrow();
    expect(screen.getByRole('option', { name: 'Commande 29' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

/* =============================================================================
   ÉCHAP REFERME LE MENU (ACC-23).

   Le nom « Menu » fait attendre Échap. Le panneau restait ouvert ; il se
   referme maintenant et rend le focus au `<summary>`, qui l'a ouvert.
   ========================================================================== */
describe('Menu : Échap referme et rend le focus au sommaire', () => {
  const ITEMS = [
    { id: 'd', label: 'Dupliquer' },
    { id: 'a', label: 'Archiver' },
  ];

  it.each([false, true])('ferme le panneau ouvert (verre : %s)', (liquidGlass) => {
    const onKeyDown = vi.fn();
    const { container } = render(
      <Menu label="Actions" items={ITEMS} liquidGlass={liquidGlass} onKeyDown={onKeyDown} open />,
    );
    const details = container.querySelector('details');
    const summary = container.querySelector('summary');
    expect(details?.open).toBe(true);
    const item = screen.getByRole('button', { name: 'Dupliquer' });
    item.focus();

    fireEvent.keyDown(item, { key: 'Escape' });

    expect(details?.open).toBe(false);
    expect(document.activeElement).toBe(summary);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('laisse passer Échap quand le menu est fermé', () => {
    const outer = vi.fn();
    const { container } = render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- écoute de test
      <div onKeyDown={(event) => outer(event.key)}>
        <Menu label="Actions" items={ITEMS} />
      </div>,
    );
    const summary = container.querySelector('summary');
    if (!summary) throw new Error('summary manquant');

    fireEvent.keyDown(summary, { key: 'Escape' });

    expect(outer).toHaveBeenCalledWith('Escape');
  });

  it('garde Échap pour lui quand il ferme : une modale englobante reste ouverte', () => {
    const outer = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- écoute de test
      <div onKeyDown={(event) => outer(event.key)}>
        <Menu label="Actions" items={ITEMS} open />
      </div>,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: 'Dupliquer' }), { key: 'Escape' });

    expect(outer).not.toHaveBeenCalled();
  });
});
