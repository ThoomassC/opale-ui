import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Sidebar, { type SidebarProps } from './Sidebar';
import type { SidebarItemLinkProps, SidebarItemProps } from './Sidebar';

/* =============================================================================
   UNE ENTRÉE DU RAIL PEUT ÊTRE UN LIEN (DX-02).

   Avec `href`, `Sidebar.Item` rend un `<a>` : clic du milieu, nouvel onglet et
   « copier l'adresse » redeviennent possibles. Sans `href`, rien ne change :
   c'est un `<button>`. `Sidebar.onNavigate` reçoit les clics simples, après
   annulation de la navigation native.
   ========================================================================== */

afterEach(cleanup);

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

const renderRail = (props?: Partial<SidebarProps>) =>
  render(
    <Sidebar collapsible {...props}>
      <Sidebar.Items>
        <Sidebar.Item itemId="dashboard" href="/tableau-de-bord">
          Tableau de bord
        </Sidebar.Item>
        <Sidebar.Item itemId="reports" href="/rapports" badge={3}>
          Rapports
        </Sidebar.Item>
        <Sidebar.Item itemId="settings">Réglages</Sidebar.Item>
        <Sidebar.Item itemId="archive" href="/archives" disabled>
          Archives
        </Sidebar.Item>
      </Sidebar.Items>
    </Sidebar>,
  );

describe('Sidebar.Item avec href', () => {
  it('devrait rendre un lien, et garder un bouton sans href', () => {
    renderRail();

    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute(
      'href',
      '/tableau-de-bord',
    );
    expect(screen.getByRole('button', { name: 'Réglages' })).toBeInTheDocument();
  });

  it('devrait marquer le lien courant par aria-current', () => {
    renderRail({ value: 'reports' });

    expect(screen.getByRole('link', { name: 'Rapports' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('devrait décrire le badge du lien, hors de son nom', () => {
    renderRail();

    expect(screen.getByRole('link', { name: 'Rapports' })).toHaveAccessibleDescription('3');
  });

  it('devrait remettre un clic simple à onNavigate et retenir l’entrée', () => {
    const onNavigate = vi.fn();
    const onValueChange = vi.fn();
    renderRail({ onNavigate, onValueChange });

    fireEvent.click(screen.getByRole('link', { name: 'Rapports' }));

    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(
      { id: 'reports', href: '/rapports' },
      expect.any(Object),
    );
    expect(nativeNavigation).toEqual([false]);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('reports');
    expect(screen.getByRole('link', { name: 'Rapports' })).toHaveAttribute('aria-current', 'page');
  });

  it('devrait laisser un clic modifié au navigateur, sans changer l’entrée retenue', () => {
    const onNavigate = vi.fn();
    const onValueChange = vi.fn();
    renderRail({ onNavigate, onValueChange, defaultValue: 'dashboard' });

    fireEvent.click(screen.getByRole('link', { name: 'Rapports' }), { ctrlKey: true });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(nativeNavigation).toEqual([true]);
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('devrait naviguer nativement sans onNavigate, en retenant quand même l’entrée', () => {
    const onValueChange = vi.fn();
    renderRail({ onValueChange });

    fireEvent.click(screen.getByRole('link', { name: 'Tableau de bord' }));

    expect(nativeNavigation).toEqual([true]);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dashboard');
  });

  it('devrait rendre un lien désactivé inerte : ni adresse, ni sélection, ni routage', () => {
    const onNavigate = vi.fn();
    const onValueChange = vi.fn();
    renderRail({ onNavigate, onValueChange });

    const archive = screen.getByRole('link', { name: 'Archives' });
    expect(archive).not.toHaveAttribute('href');
    expect(archive).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(archive);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('devrait appeler le onClick de l’appelant et lui transmettre la ref du lien', () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLAnchorElement | HTMLButtonElement>();
    render(
      <Sidebar>
        <Sidebar.Items>
          <Sidebar.Item ref={ref} itemId="a" href="/a" onClick={onClick}>
            A
          </Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'A' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it('devrait garder son nom et son infobulle, rail replié', () => {
    renderRail({ defaultCollapsed: true });

    const link = screen.getByRole('link', { name: 'Tableau de bord' });
    expect(link).toHaveAttribute('data-opale-tooltip', 'true');
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(link).toHaveAttribute('data-opale-tooltip', 'dismissed');
  });
});

/* `SidebarItemProps` RESTE UN TYPE OBJET, comme en 3.9 : une interface
   d'application peut l'étendre. La variante lien a son propre nom
   (`SidebarItemLinkProps`) ; `tsc` échouerait ici si l'union revenait. */
export interface ExtendedSidebarItemProps extends SidebarItemProps {
  tracking?: string;
}
export interface ExtendedSidebarLinkProps extends SidebarItemLinkProps {
  tracking?: string;
}
