import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NavBubble, type NavBubbleProps } from './nav-bubble';
import type { SiteNavItem } from './site-nav';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/* =============================================================================
   LA BULLE DE NAVIGATION : GLISSER, LÂCHER, ET CE QUE LE CLIC QUI SUIT DEVIENT.

   jsdom ne met rien en page : chaque test pose la GÉOMÉTRIE qu'un navigateur
   aurait calculée — quatre onglets de 50 px côte à côte, une bulle de la
   largeur d'un onglet — et la capture de pointeur, qu'il n'implémente pas.
   C'est la seule frontière simulée ; le composant, lui, est le vrai.
   ========================================================================== */

const ITEMS: readonly SiteNavItem[] = [
  { id: 'map', href: '/map', label: 'Map' },
  { id: 'countries', href: '/countries', label: 'Countries' },
  { id: 'cities', href: '/cities', label: 'Cities' },
  { id: 'about', href: '/about', label: 'About' },
];

const TAB_WIDTH = 50;

const list = () => screen.getByRole('list');
const link = (name: string) => screen.getByRole('link', { name });
const bubble = () => list().querySelector<HTMLElement>(':scope > [aria-hidden="true"]');
const bubbleLeft = () => bubble()?.style.insetInlineStart ?? '';

/** La capture de pointeur, que jsdom n'implémente pas. */
function stubPointerCapture() {
  ITEMS.forEach((item) => {
    const anchor = link(String(item.label));
    let captured: number | undefined;
    anchor.setPointerCapture = (id: number) => {
      captured = id;
    };
    anchor.hasPointerCapture = (id: number) => captured === id;
    anchor.releasePointerCapture = () => {
      captured = undefined;
    };
  });
}

/** Pose la mise en page qu'aurait calculée un navigateur. */
function layOut() {
  stubPointerCapture();
  vi.spyOn(list(), 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, TAB_WIDTH * ITEMS.length, 44),
  );
  ITEMS.forEach((item, index) => {
    vi.spyOn(link(String(item.label)), 'getBoundingClientRect').mockReturnValue(
      new DOMRect(index * TAB_WIDTH, 0, TAB_WIDTH, 44),
    );
  });
  const surface = bubble();
  if (surface) {
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, TAB_WIDTH, 44));
  }
}

/** Un hôte qui route pour de vrai : `activeKey` suit la navigation. */
function Routed({ onNavigate }: { readonly onNavigate?: NavBubbleProps['onNavigate'] }) {
  const [active, setActive] = useState('map');
  return (
    <NavBubble
      items={ITEMS}
      activeKey={active}
      onNavigate={(item, event) => {
        setActive(item.id);
        onNavigate?.(item, event);
      }}
    />
  );
}

const press = (name: string, clientX: number, pointerId = 1) =>
  fireEvent.pointerDown(link(name), { button: 0, clientX, pointerId });
const moveTo = (clientX: number, pointerId = 1) =>
  fireEvent.pointerMove(window, { clientX, pointerId });
const release = (clientX: number, pointerId = 1) =>
  fireEvent.pointerUp(window, { clientX, pointerId });

describe('NavBubble — le glissement', () => {
  it('devrait naviguer vers l’onglet où l’on lâche la bulle', () => {
    const onNavigate = vi.fn();
    render(<Routed onNavigate={onNavigate} />);
    layOut();

    press('Map', 25);
    moveTo(125);
    release(125);

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate.mock.calls[0][0]).toBe(ITEMS[2]);
    expect(link('Cities')).toHaveAttribute('aria-current', 'page');
    expect(list()).not.toHaveAttribute('data-dragging');
  });

  it('devrait avaler le clic que le navigateur émet après le lâcher', () => {
    const onNavigate = vi.fn();
    render(<Routed onNavigate={onNavigate} />);
    layOut();

    press('Map', 25);
    moveTo(75);
    release(75);
    /* Le clic de synthèse part sur l'élément capturé : l'onglet de départ. */
    const synthetic = fireEvent.click(link('Map'));

    expect(synthetic, 'Le clic de fin de geste doit être annulé.').toBe(false);
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(link('Countries')).toHaveAttribute('aria-current', 'page');
  });

  it('devrait rendre le clic suivant à la navigation une fois le clic de geste avalé', () => {
    const onNavigate = vi.fn();
    render(<Routed onNavigate={onNavigate} />);
    layOut();

    press('Map', 25);
    moveTo(75);
    release(75);
    fireEvent.click(link('Map'));
    fireEvent.click(link('About'));

    expect(onNavigate).toHaveBeenCalledTimes(2);
    expect(link('About')).toHaveAttribute('aria-current', 'page');
  });

  it('ne devrait rien naviguer quand la bulle revient à son onglet de départ', () => {
    const onNavigate = vi.fn();
    render(<Routed onNavigate={onNavigate} />);
    layOut();

    press('Map', 25);
    moveTo(30);
    release(30);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(link('Map')).toHaveAttribute('aria-current', 'page');
    expect(fireEvent.click(link('Map')), 'Le clic de fin de geste reste avalé.').toBe(false);
  });

  it('devrait suivre le doigt, bornée à 3 px des deux bords de la piste', () => {
    render(<Routed />);
    layOut();

    press('Map', 25);
    expect(list()).toHaveAttribute('data-dragging', 'true');
    expect(bubbleLeft(), 'La bulle part de là où elle était.').toBe('0px');

    moveTo(85);
    expect(bubbleLeft(), 'Le doigt tient la bulle par son milieu.').toBe('60px');

    moveTo(-400);
    expect(bubbleLeft()).toBe('3px');

    moveTo(900);
    expect(bubbleLeft()).toBe(`${TAB_WIDTH * ITEMS.length - TAB_WIDTH - 3}px`);

    release(900);
    expect(bubbleLeft(), 'Lâchée, la bulle rend sa place à la feuille.').toBe('');
  });

  it('devrait viser l’onglet le plus proche quand le doigt sort de la piste', () => {
    render(<Routed />);
    layOut();

    press('Map', 25);
    moveTo(900);

    expect(link('About')).toHaveAttribute('aria-current', 'page');
    expect(list()).toHaveAttribute('data-active-index', '3');
  });

  it('devrait ignorer les mouvements d’un autre pointeur', () => {
    render(<Routed />);
    layOut();

    press('Map', 25, 1);
    moveTo(175, 2);
    release(175, 2);

    expect(link('Map')).toHaveAttribute('aria-current', 'page');
    expect(list(), 'Le geste du premier pointeur continue.').toHaveAttribute(
      'data-dragging',
      'true',
    );
  });

  it('ne devrait pas démarrer de glissement depuis un onglet inactif', () => {
    render(<Routed />);
    layOut();

    press('Countries', 75);

    expect(list()).not.toHaveAttribute('data-dragging');
  });

  it('ne devrait pas démarrer de glissement avec un autre bouton que le principal', () => {
    render(<Routed />);
    layOut();

    fireEvent.pointerDown(link('Map'), { button: 2, clientX: 25, pointerId: 1 });

    expect(list()).not.toHaveAttribute('data-dragging');
  });

  it('devrait terminer le geste sans naviguer quand le pointeur est annulé', () => {
    const onNavigate = vi.fn();
    render(<Routed onNavigate={onNavigate} />);
    layOut();

    press('Map', 25);
    moveTo(75);
    fireEvent.pointerCancel(window, { clientX: 75, pointerId: 1 });

    expect(list()).not.toHaveAttribute('data-dragging');
    expect(onNavigate).not.toHaveBeenCalled();
    expect(fireEvent.click(link('About')), 'Aucun clic n’est à avaler.').toBe(false);
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('devrait lâcher les écouteurs de fenêtre quand elle est démontée en plein geste', () => {
    const { unmount } = render(<Routed />);
    layOut();
    press('Map', 25);
    const removed = vi.spyOn(window, 'removeEventListener');

    unmount();

    expect(removed.mock.calls.map(([type]) => type)).toEqual(
      expect.arrayContaining(['pointermove', 'pointerup', 'pointercancel']),
    );
  });

  it('devrait refuser le glisser-déposer natif du lien', () => {
    render(<Routed />);

    expect(fireEvent.dragStart(link('Map'))).toBe(false);
  });

  it('ne devrait pas faire suivre la bulle quand sa largeur est nulle', () => {
    render(<Routed />);
    stubPointerCapture();

    press('Map', 25);
    moveTo(125);

    expect(list()).toHaveAttribute('data-dragging', 'true');
    expect(bubbleLeft(), 'Sans largeur mesurée, la bulle ne suit pas le doigt.').toBe('0px');
  });
});

describe('NavBubble — le clic', () => {
  it.each([
    { modifier: 'metaKey' },
    { modifier: 'ctrlKey' },
    { modifier: 'shiftKey' },
    { modifier: 'altKey' },
  ])('devrait laisser au navigateur un clic avec $modifier', ({ modifier }) => {
    const onNavigate = vi.fn();
    render(<Routed onNavigate={onNavigate} />);

    const notPrevented = fireEvent.click(link('Countries'), { [modifier]: true });

    expect(notPrevented).toBe(true);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(link('Map')).toHaveAttribute('aria-current', 'page');
  });

  it('devrait laisser au navigateur un lien ouvert dans un nouvel onglet', () => {
    const onNavigate = vi.fn();
    render(<Routed onNavigate={onNavigate} />);
    link('Countries').setAttribute('target', '_blank');

    expect(fireEvent.click(link('Countries'))).toBe(true);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire quand on clique l’onglet déjà courant', () => {
    const onNavigate = vi.fn();
    render(<Routed onNavigate={onNavigate} />);

    fireEvent.click(link('Map'));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(list()).not.toHaveAttribute('data-moving');
  });

  it('devrait déplacer la bulle sans annuler le lien quand personne ne route', () => {
    render(<NavBubble items={ITEMS} activeKey="map" />);

    expect(fireEvent.click(link('Cities'))).toBe(true);
    expect(link('Cities')).toHaveAttribute('aria-current', 'page');
  });

  it('devrait garder l’animation de trajet 600 ms (--opale-motion-slower), relancée à chaque nouveau départ', () => {
    vi.useFakeTimers();
    render(<NavBubble items={ITEMS} activeKey="map" />);

    fireEvent.click(link('Countries'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.click(link('Cities'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(list(), 'Le second départ repart pour 600 ms.').toHaveAttribute('data-moving', 'true');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(list()).not.toHaveAttribute('data-moving');
  });

  it('devrait céder la place à la page que l’hôte déclare ensuite', () => {
    const { rerender } = render(<NavBubble items={ITEMS} activeKey="map" />);

    fireEvent.click(link('Countries'));
    rerender(<NavBubble items={ITEMS} activeKey="about" />);

    expect(link('About')).toHaveAttribute('aria-current', 'page');
    expect(list()).toHaveAttribute('data-active-index', '3');
  });

  it('devrait placer la bulle sur le premier onglet sans page déclarée', () => {
    render(<NavBubble items={ITEMS} />);

    expect(link('Map')).toHaveAttribute('aria-current', 'page');
    expect(list()).toHaveAttribute('data-active-index', '0');
  });

  it('devrait placer la bulle au début quand la page déclarée est inconnue', () => {
    render(<NavBubble items={ITEMS} activeKey="ailleurs" />);

    expect(list()).toHaveAttribute('data-active-index', '0');
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
  });
});
