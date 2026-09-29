import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette } from './opale';

/* La palette et sa liste de commandes : le motif combobox de l'APG. */

afterEach(cleanup);

describe('CommandPalette — liste de commandes', () => {
  const ITEMS = [
    { id: 'theme', label: 'Changer de thème' },
    { id: 'lang', label: 'Changer de langue', disabled: true },
    { id: 'print', label: 'Imprimer' },
  ] as const;

  it('garde la recherche libre, sans combobox, quand items est absent', () => {
    render(
      <CommandPalette open onOpenChange={() => {}}>
        <p>Libre</p>
      </CommandPalette>,
    );

    expect(screen.getByRole('searchbox', { name: 'Rechercher une commande' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Libre')).toBeInTheDocument();
  });

  it('expose une combobox reliée à une liste d’options', () => {
    render(<CommandPalette open items={ITEMS} />);

    const combobox = screen.getByRole('combobox', { name: 'Rechercher une commande' });
    const listbox = screen.getByRole('listbox', { name: 'Commandes' });
    expect(combobox).toHaveAttribute('aria-controls', listbox.id);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Changer de langue' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('annonce le nombre de résultats dans une région de statut', () => {
    const { rerender } = render(<CommandPalette open items={ITEMS} />);
    expect(screen.getByRole('status')).toHaveTextContent('3 résultats');

    rerender(<CommandPalette open items={ITEMS.slice(0, 1)} />);
    expect(screen.getByRole('status')).toHaveTextContent('1 résultat');

    rerender(<CommandPalette open items={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('Aucun résultat');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('parcourt les options aux flèches, en sautant les inactives, et valide à Entrée', async () => {
    const user = userEvent.setup();
    const onItemSelect = vi.fn();
    const onPrint = vi.fn();
    render(
      <CommandPalette
        open
        items={[ITEMS[0], ITEMS[1], { ...ITEMS[2], onSelect: onPrint }]}
        onItemSelect={onItemSelect}
      />,
    );
    const combobox = screen.getByRole('combobox');
    combobox.focus();
    const active = () =>
      document.getElementById(combobox.getAttribute('aria-activedescendant') ?? '');

    expect(active()).toHaveTextContent('Changer de thème');
    expect(active()).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    expect(active()).toHaveTextContent('Imprimer');

    await user.keyboard('{ArrowDown}');
    expect(active()).toHaveTextContent('Changer de thème');

    await user.keyboard('{ArrowUp}');
    expect(active()).toHaveTextContent('Imprimer');

    await user.keyboard('{Enter}');
    expect(onPrint).toHaveBeenCalledTimes(1);
    expect(onItemSelect).toHaveBeenCalledExactlyOnceWith('print');
    expect(combobox).toHaveFocus();
  });

  it('valide une option au clic, jamais une option inactive', async () => {
    const user = userEvent.setup();
    const onItemSelect = vi.fn();
    render(<CommandPalette open items={ITEMS} onItemSelect={onItemSelect} />);

    await user.click(screen.getByRole('option', { name: 'Imprimer' }));
    await user.click(screen.getByRole('option', { name: 'Changer de langue' }));

    expect(onItemSelect).toHaveBeenCalledExactlyOnceWith('print');
  });

  it('ne pose pas de repère de recherche dans la palette', () => {
    render(<CommandPalette open items={ITEMS} />);

    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });
});
