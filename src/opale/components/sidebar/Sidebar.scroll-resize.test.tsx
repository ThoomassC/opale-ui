import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar, { type SidebarProps } from './Sidebar';

/* LA BARRE DE DÉFILEMENT ET LA POIGNÉE DE LARGEUR DU SOMMAIRE DE LA
   DOCUMENTATION, devenues deux options du rail : `customScrollbar` et
   `resizable`. Toutes deux se manient au pointeur ET au clavier. */

const renderRail = (props: Partial<SidebarProps> = {}) =>
  render(
    <Sidebar {...props}>
      <Sidebar.Items>
        <Sidebar.Item itemId="usage">Utilisation</Sidebar.Item>
        <Sidebar.Item itemId="themes">Thèmes</Sidebar.Item>
      </Sidebar.Items>
    </Sidebar>,
  );

/* jsdom n'a pas de mise en page : la zone qui défile reçoit ici une hauteur
   visible de 200 px pour 1 000 px de contenu. */
const fakeLayout = () => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
};

afterEach(() => vi.restoreAllMocks());

describe('Sidebar — la barre de défilement (`customScrollbar`)', () => {
  it('ne la rend pas par défaut', () => {
    renderRail();
    expect(screen.queryByRole('scrollbar')).toBeNull();
  });

  it('se cache, lecteurs d’écran compris, quand rien ne dépasse', () => {
    renderRail({ customScrollbar: true });
    expect(screen.queryByRole('scrollbar')).toBeNull();
    expect(document.querySelector('.opale-sidebar__scrollbar')).toHaveAttribute(
      'data-idle',
      'true',
    );
  });

  it('rend une barre nommée qui pilote la zone qui défile', () => {
    fakeLayout();
    renderRail({ customScrollbar: true });

    const bar = screen.getByRole('scrollbar', { name: 'Défilement du rail' });
    const region = document.getElementById(bar.getAttribute('aria-controls') ?? '');
    expect(region).not.toBeNull();
    expect(region).toHaveClass('opale-sidebar__scroll');
    expect(region).toContainElement(screen.getByRole('button', { name: 'Utilisation' }));
    expect(bar).toHaveAttribute('aria-orientation', 'vertical');
    expect(bar).toHaveAttribute('aria-valuemax', '800');
    expect(bar).toHaveAttribute('tabindex', '0');
  });

  it('fait défiler au clavier : Fin, Début, page suivante', () => {
    fakeLayout();
    renderRail({ customScrollbar: true });
    const bar = screen.getByRole('scrollbar');
    const region = document.getElementById(bar.getAttribute('aria-controls') ?? '') as HTMLElement;

    fireEvent.keyDown(bar, { key: 'End' });
    expect(region.scrollTop).toBe(800);
    fireEvent.keyDown(bar, { key: 'Home' });
    expect(region.scrollTop).toBe(0);
    fireEvent.keyDown(bar, { key: 'PageDown' });
    expect(region.scrollTop).toBe(200);
  });

  it('se traduit avec `labels`', () => {
    fakeLayout();
    renderRail({ customScrollbar: true, labels: { scroll: 'Rail scroll' } });
    expect(screen.getByRole('scrollbar', { name: 'Rail scroll' })).toBeInTheDocument();
  });
});

describe('Sidebar — la poignée de largeur (`resizable`)', () => {
  it('ne la rend pas par défaut', () => {
    renderRail();
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('rend un séparateur nommé, à la largeur de la taille choisie', () => {
    renderRail({ resizable: true });

    const handle = screen.getByRole('separator', { name: 'Largeur du rail' });
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-valuenow', '260');
    expect(handle).toHaveAttribute('aria-valuetext', '260 px');
    expect(handle).toHaveAttribute('aria-valuemin', '224');
    expect(handle).toHaveAttribute('aria-valuemax', '480');
    expect(handle).toHaveAttribute('tabindex', '0');
    expect(document.querySelector('aside')).toHaveStyle({ width: '260px' });
  });

  it('se règle au clavier, bornée, et le dit à `onWidthChange`', () => {
    const onWidthChange = vi.fn();
    renderRail({ resizable: true, onWidthChange });
    const handle = screen.getByRole('separator');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '276');
    expect(onWidthChange).toHaveBeenLastCalledWith(276);

    fireEvent.keyDown(handle, { key: 'End' });
    expect(handle).toHaveAttribute('aria-valuenow', '480');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '480');

    fireEvent.keyDown(handle, { key: 'Home' });
    expect(handle).toHaveAttribute('aria-valuenow', '224');
    expect(document.querySelector('aside')).toHaveStyle({ width: '224px' });
  });

  it('se règle au glisser', () => {
    renderRail({ resizable: true, defaultWidth: 300 });
    const handle = screen.getByRole('separator');

    fireEvent.pointerDown(handle, { pointerId: 3, clientX: 100 });
    fireEvent.pointerMove(handle, { pointerId: 3, clientX: 140 });
    expect(handle).toHaveAttribute('aria-valuenow', '340');
    fireEvent.pointerUp(handle, { pointerId: 3, clientX: 140 });

    fireEvent.pointerMove(handle, { pointerId: 3, clientX: 400 });
    expect(handle).toHaveAttribute('aria-valuenow', '340');
  });

  it('suit `width` quand l’appelant la pilote', () => {
    const { rerender } = render(
      <Sidebar resizable width={250}>
        <Sidebar.Items />
      </Sidebar>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '250');
    rerender(
      <Sidebar resizable width={320}>
        <Sidebar.Items />
      </Sidebar>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '320');
  });

  it('disparaît quand le rail est plié, qui a sa propre largeur', () => {
    renderRail({ resizable: true, collapsible: true, defaultCollapsed: true });
    expect(screen.queryByRole('separator')).toBeNull();
  });
});
