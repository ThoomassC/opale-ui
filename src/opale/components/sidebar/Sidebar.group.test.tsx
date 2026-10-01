import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar, { SidebarGroup } from './Sidebar';

/* LES PARTIES DU RAIL : un titre, puis ses entrées — le sommaire de la
   documentation d'Opale, devenu une pièce de la librairie. Le titre nomme le
   groupe ; repliable, il est un bouton qui dit s'il est ouvert. */

const renderGroups = (
  group: Partial<Parameters<typeof SidebarGroup>[0]> = {},
  rail: { collapsed?: boolean } = {},
) =>
  render(
    <Sidebar collapsible defaultCollapsed={rail.collapsed}>
      <Sidebar.Items>
        <Sidebar.Group title="Prise en main" {...group}>
          <Sidebar.Item itemId="usage">Utilisation</Sidebar.Item>
          <Sidebar.Item itemId="themes">Thèmes</Sidebar.Item>
        </Sidebar.Group>
        <Sidebar.Group title="Fondations">
          <Sidebar.Item itemId="palette">La palette</Sidebar.Item>
        </Sidebar.Group>
      </Sidebar.Items>
    </Sidebar>,
  );

describe('Sidebar.Group', () => {
  it('devrait nommer chaque groupe par son titre', () => {
    renderGroups();

    const group = screen.getByRole('group', { name: 'Prise en main' });
    expect(within(group).getByRole('button', { name: 'Utilisation' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Fondations' })).toBeInTheDocument();
  });

  it('devrait replier le groupe au titre, et le dire', () => {
    renderGroups();

    const title = screen.getByRole('button', { name: 'Prise en main' });
    expect(title).toHaveAttribute('aria-expanded', 'true');
    const content = document.getElementById(title.getAttribute('aria-controls') ?? '');
    expect(content).not.toBeNull();

    fireEvent.click(title);

    expect(title).toHaveAttribute('aria-expanded', 'false');
    expect(content).not.toBeVisible();
    expect(screen.queryByRole('button', { name: 'Utilisation' })).toBeNull();
  });

  it('devrait partir fermé avec `defaultOpen={false}` et prévenir `onOpenChange`', () => {
    const onOpenChange = vi.fn();
    renderGroups({ defaultOpen: false, onOpenChange });

    const title = screen.getByRole('button', { name: 'Prise en main' });
    expect(title).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(title);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Utilisation' })).toBeVisible();
  });

  it('devrait suivre `open` quand l’appelant le pilote', () => {
    const { rerender } = render(
      <Sidebar>
        <Sidebar.Items>
          <Sidebar.Group title="Fondations" open={false}>
            <Sidebar.Item itemId="palette">La palette</Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Items>
      </Sidebar>,
    );
    expect(screen.getByRole('button', { name: 'Fondations' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    rerender(
      <Sidebar>
        <Sidebar.Items>
          <Sidebar.Group title="Fondations" open>
            <Sidebar.Item itemId="palette">La palette</Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Items>
      </Sidebar>,
    );
    expect(screen.getByRole('button', { name: 'La palette' })).toBeVisible();
  });

  it('devrait garder un titre simple, sans bouton, quand le groupe ne se replie pas', () => {
    renderGroups({ collapsible: false });

    expect(screen.queryByRole('button', { name: 'Prise en main' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Prise en main' })).toBeInTheDocument();
  });

  it('devrait montrer toutes les entrées quand le rail est plié, titre gardé pour le lecteur', () => {
    renderGroups({ defaultOpen: false }, { collapsed: true });

    /* Plié, le rail n'a plus la place d'un titre : les icônes restent, le
       groupe garde son nom, et un groupe fermé ne cacherait que des icônes. */
    expect(screen.queryByRole('button', { name: 'Prise en main' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Prise en main' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Utilisation' })).toBeInTheDocument();
  });

  it('devrait porter les classes stables du groupe', () => {
    renderGroups();

    const group = screen.getByRole('group', { name: 'Prise en main' });
    expect(group).toHaveClass('opale-sidebar__group');
    expect(group.querySelector('.opale-sidebar__group-title')).not.toBeNull();
  });

  it('devrait être le même objet sous son propre nom, pour les Server Components', () => {
    expect(Sidebar.Group).toBe(SidebarGroup);
  });
});
