import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar, { type SidebarProps } from './Sidebar';

/* LE FORMAT MOBILE DU SOMMAIRE DE LA DOCUMENTATION, devenu celui du rail
   (`mobile`) : un bouton « Sommaire » qui déplie la liste, une rangée de
   raccourcis vers chaque partie, puis le rail. */

const renderRail = (props: Partial<SidebarProps> = {}) =>
  render(
    <Sidebar mobile="menu" {...props}>
      <Sidebar.Items>
        <Sidebar.Group title="Prise en main">
          <Sidebar.Item itemId="usage">Utilisation</Sidebar.Item>
        </Sidebar.Group>
        <Sidebar.Group title="Fondations" defaultOpen={false}>
          <Sidebar.Item itemId="palette">La palette</Sidebar.Item>
        </Sidebar.Group>
      </Sidebar.Items>
    </Sidebar>,
  );

describe('Sidebar — le format mobile (`mobile`)', () => {
  it('ne rend ni bouton ni raccourcis par défaut', () => {
    render(
      <Sidebar>
        <Sidebar.Items>
          <Sidebar.Group title="Prise en main">
            <Sidebar.Item itemId="usage">Utilisation</Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Items>
      </Sidebar>,
    );
    expect(screen.queryByRole('button', { name: 'Sommaire' })).toBeNull();
  });

  it('part replié : le bouton « Sommaire » cache le rail', () => {
    renderRail();

    const toggle = screen.getByRole('button', { name: 'Sommaire' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(toggle.getAttribute('aria-controls') ?? '')).not.toBeVisible();
    expect(screen.queryByRole('button', { name: 'Utilisation' })).toBeNull();
  });

  it('déplie le rail et ses raccourcis, une pastille par partie', () => {
    renderRail();

    fireEvent.click(screen.getByRole('button', { name: 'Sommaire' }));

    expect(screen.getByRole('button', { name: 'Sommaire' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const shortcuts = screen.getByRole('group', { name: 'Parties du rail' });
    expect(
      within(shortcuts)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Prise en main', 'Fondations']);
    expect(screen.getByRole('button', { name: 'Utilisation' })).toBeVisible();
  });

  it('ouvre la partie visée par un raccourci', () => {
    renderRail();
    fireEvent.click(screen.getByRole('button', { name: 'Sommaire' }));
    expect(screen.queryByRole('button', { name: 'La palette' })).toBeNull();

    const shortcuts = screen.getByRole('group', { name: 'Parties du rail' });
    fireEvent.click(within(shortcuts).getByRole('button', { name: 'Fondations' }));

    expect(screen.getByRole('button', { name: 'La palette' })).toBeVisible();
  });

  it('se replie à Échap et rend le focus au bouton', () => {
    renderRail();
    fireEvent.click(screen.getByRole('button', { name: 'Sommaire' }));
    const item = screen.getByRole('button', { name: 'Utilisation' });
    item.focus();

    fireEvent.keyDown(item, { key: 'Escape' });

    const toggle = screen.getByRole('button', { name: 'Sommaire' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('n’a pas de poignée de largeur : le rail prend toute la largeur', () => {
    renderRail({ resizable: true });
    fireEvent.click(screen.getByRole('button', { name: 'Sommaire' }));
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('se traduit avec `labels`', () => {
    renderRail({ labels: { menu: 'Contents', shortcuts: 'Rail parts' } });
    fireEvent.click(screen.getByRole('button', { name: 'Contents' }));
    expect(screen.getByRole('group', { name: 'Rail parts' })).toBeInTheDocument();
  });
});
