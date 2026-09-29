import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SvgMap, type SvgMapRegion } from '../../opale';
import type { SvgMapWheel } from './useSvgMapGestures';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/* =============================================================================
   LES GESTES DE LA CARTE, PAR CE QUE LA CARTE MONTRE.

   Chaque test lit le `viewBox` rendu : c'est la seule chose que l'utilisateur
   voit bouger. jsdom ne met rien en page, donc la boîte du `<svg>` est posée à
   400 × 200 px — un pixel vaut une unité du dessin à la vue d'ensemble — et
   l'horloge des images est simulée quand un zoom est animé.
   ========================================================================== */

const REGIONS: readonly SvgMapRegion[] = [
  { id: 'a', path: 'M0 0 H100 V100 H0 Z', name: 'Alpha' },
  { id: 'b', path: 'M100 0 H200 V100 H100 Z', name: 'Bêta' },
];

function renderMap({ wheel }: { readonly wheel?: SvgMapWheel } = {}) {
  const { container, unmount } = render(
    <SvgMap viewBox="0 0 400 200" regions={REGIONS} wheel={wheel} />,
  );
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('La carte ne rend pas de <svg>.');
  const canvas = container.querySelector('.opale-svg-map__canvas');
  const hint = container.querySelector('.opale-svg-map__hint');
  return { svg, canvas, hint, unmount };
}

/** La boîte qu'un navigateur aurait mesurée. */
function layOut(svg: SVGSVGElement) {
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 200));
}

/** Le `viewBox` rendu, en nombres. */
function view(svg: SVGSVGElement) {
  const [x, y, width, height] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
  return { x, y, width, height };
}

/** Une molette native : React écoute la sienne en passif, la carte non. */
function wheelOn(svg: SVGSVGElement, init: WheelEventInit) {
  const event = new WheelEvent('wheel', { cancelable: true, bubbles: true, ...init });
  act(() => {
    svg.dispatchEvent(event);
  });
  return event;
}

/** Zoome sans animation, au Ctrl + molette, au centre de la carte. */
function zoomIn(svg: SVGSVGElement) {
  wheelOn(svg, { deltaY: -200, ctrlKey: true, clientX: 200, clientY: 100 });
}

describe('le glissement', () => {
  it('devrait déplacer la vue zoomée dans le sens du doigt', () => {
    const { svg, canvas } = renderMap();
    layOut(svg);
    zoomIn(svg);
    const before = view(svg);

    fireEvent.pointerDown(svg, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 140, clientY: 110, pointerId: 1 });

    expect(canvas).toHaveAttribute('data-dragging', 'true');
    const scale = before.width / 400;
    /* Le `viewBox` est écrit à 4 décimales. */
    expect(view(svg).x).toBeCloseTo(before.x - 40 * scale, 3);
    expect(view(svg).y).toBeCloseTo(before.y - 10 * scale, 3);

    fireEvent.pointerUp(window, { clientX: 140, clientY: 110, pointerId: 1 });
    expect(canvas).not.toHaveAttribute('data-dragging');
  });

  it('ne devrait rien déplacer tant que le doigt reste dans la tolérance', () => {
    const { svg, canvas } = renderMap();
    layOut(svg);
    zoomIn(svg);
    const before = svg.getAttribute('viewBox');

    fireEvent.pointerDown(svg, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 104, clientY: 102, pointerId: 1 });

    expect(canvas).not.toHaveAttribute('data-dragging');
    expect(svg.getAttribute('viewBox')).toBe(before);
  });

  it('devrait finir le geste quand le pointeur est annulé', () => {
    const { svg, canvas } = renderMap();
    layOut(svg);
    zoomIn(svg);

    fireEvent.pointerDown(svg, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 140, clientY: 100, pointerId: 1 });
    fireEvent.pointerCancel(window, { pointerId: 1 });
    const settled = svg.getAttribute('viewBox');
    fireEvent.pointerMove(window, { clientX: 200, clientY: 100, pointerId: 1 });

    expect(canvas).not.toHaveAttribute('data-dragging');
    expect(svg.getAttribute('viewBox'), 'Le geste est fini : plus rien ne bouge.').toBe(settled);
  });

  it('devrait ignorer le bouton droit de la souris', () => {
    const { svg, canvas } = renderMap();
    layOut(svg);
    zoomIn(svg);
    const before = svg.getAttribute('viewBox');

    fireEvent.pointerDown(svg, {
      button: 2,
      pointerType: 'mouse',
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(window, { clientX: 160, clientY: 100, pointerId: 1 });

    expect(canvas).not.toHaveAttribute('data-dragging');
    expect(svg.getAttribute('viewBox')).toBe(before);
  });

  it('ne devrait rien déplacer quand la carte n’a pas de taille mesurable', () => {
    const { svg, canvas } = renderMap();
    zoomIn(svg);
    const before = svg.getAttribute('viewBox');

    fireEvent.pointerDown(svg, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 160, clientY: 100, pointerId: 1 });

    expect(canvas, 'Le geste est bien reconnu…').toHaveAttribute('data-dragging', 'true');
    expect(svg.getAttribute('viewBox'), '…mais rien ne se divise par zéro.').toBe(before);
  });

  it('devrait lâcher ses écouteurs de fenêtre quand la carte est démontée en plein geste', () => {
    const { svg, unmount } = renderMap();
    fireEvent.pointerDown(svg, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    const removed = vi.spyOn(window, 'removeEventListener');

    unmount();

    expect(removed.mock.calls.map(([type]) => type)).toEqual(
      expect.arrayContaining(['pointermove', 'pointerup', 'pointercancel']),
    );
  });
});

describe('le pincement', () => {
  it('devrait zoomer d’autant que les deux doigts s’écartent', () => {
    const { svg } = renderMap();
    layOut(svg);

    fireEvent.pointerDown(svg, { button: 0, clientX: 150, clientY: 100, pointerId: 1 });
    fireEvent.pointerDown(svg, { button: 0, clientX: 250, clientY: 100, pointerId: 2 });
    fireEvent.pointerMove(window, { clientX: 350, clientY: 100, pointerId: 2 });

    expect(view(svg).width, 'Écart doublé : la vue est deux fois plus étroite.').toBeCloseTo(200);
  });

  it('devrait garder le geste ouvert tant qu’un doigt reste posé', () => {
    const { svg, canvas } = renderMap();
    layOut(svg);
    zoomIn(svg);

    fireEvent.pointerDown(svg, { button: 0, clientX: 150, clientY: 100, pointerId: 1 });
    fireEvent.pointerDown(svg, { button: 0, clientX: 250, clientY: 100, pointerId: 2 });
    fireEvent.pointerUp(window, { clientX: 250, clientY: 100, pointerId: 2 });
    const before = view(svg);
    fireEvent.pointerMove(window, { clientX: 190, clientY: 100, pointerId: 1 });

    expect(canvas).toHaveAttribute('data-dragging', 'true');
    expect(view(svg).x, 'Le doigt restant fait glisser la vue.').toBeLessThan(before.x);
  });
});

describe('la molette', () => {
  it('devrait zoomer autour du pointeur avec Ctrl, et garder la page immobile', () => {
    const { svg } = renderMap();
    layOut(svg);

    const event = wheelOn(svg, { deltaY: -200, ctrlKey: true, clientX: 0, clientY: 0 });

    expect(event.defaultPrevented).toBe(true);
    expect(view(svg).width).toBeLessThan(400);
    expect(view(svg).x, 'Le coin visé reste sous le pointeur.').toBe(0);
    expect(view(svg).y).toBe(0);
  });

  it('devrait zoomer autour du centre quand le pointeur ne peut pas être situé', () => {
    const { svg } = renderMap();

    wheelOn(svg, { deltaY: -200, ctrlKey: true, clientX: 0, clientY: 0 });

    const { x, width } = view(svg);
    expect(width).toBeLessThan(400);
    expect(x).toBeCloseTo((400 - width) / 2);
  });

  it('devrait donner au pincement d’un pavé tactile une sensibilité plus fine qu’à la molette', () => {
    const trackpad = renderMap();
    wheelOn(trackpad.svg, { deltaY: -10, ctrlKey: true });
    const pinched = view(trackpad.svg).width;
    trackpad.unmount();

    const mouse = renderMap();
    wheelOn(mouse.svg, { deltaY: -10, metaKey: true });
    const scrolled = view(mouse.svg).width;

    expect(pinched).toBeCloseTo(400 / Math.exp(0.1));
    expect(scrolled).toBeCloseTo(400 / Math.exp(0.025));
  });

  it('devrait zoomer à la molette nue quand l’hôte le demande', () => {
    const { svg, hint } = renderMap({ wheel: 'always' });

    const event = wheelOn(svg, { deltaY: -200 });

    expect(event.defaultPrevented).toBe(true);
    expect(view(svg).width).toBeLessThan(400);
    expect(hint).not.toHaveAttribute('data-visible');
  });

  it('ne devrait jamais zoomer à la molette quand l’hôte la coupe', () => {
    const { svg, hint } = renderMap({ wheel: false });

    const bare = wheelOn(svg, { deltaY: -200 });
    const modified = wheelOn(svg, { deltaY: -200, ctrlKey: true });

    expect(bare.defaultPrevented).toBe(false);
    expect(modified.defaultPrevented).toBe(false);
    expect(svg.getAttribute('viewBox')).toBe('0 0 400 200');
    expect(hint).not.toHaveAttribute('data-visible');
  });

  it('devrait montrer la consigne 1,6 s après la dernière molette nue', () => {
    vi.useFakeTimers();
    const { svg, hint } = renderMap();

    wheelOn(svg, { deltaY: -100 });
    expect(hint).toHaveAttribute('data-visible', 'true');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    wheelOn(svg, { deltaY: -100 });
    act(() => {
      vi.advanceTimersByTime(1599);
    });
    expect(hint, 'Une nouvelle molette relance le délai.').toHaveAttribute('data-visible', 'true');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(hint).not.toHaveAttribute('data-visible');
  });

  it('devrait retirer la consigne dès qu’on zoome comme elle le dit', () => {
    const { svg, hint } = renderMap();

    wheelOn(svg, { deltaY: -100 });
    wheelOn(svg, { deltaY: -100, ctrlKey: true });

    expect(hint).not.toHaveAttribute('data-visible');
  });

  it('ne devrait laisser aucun délai en attente une fois démontée', () => {
    vi.useFakeTimers();
    const { svg, unmount } = renderMap();
    wheelOn(svg, { deltaY: -100 });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('le zoom animé', () => {
  /** L'horloge et les images simulées, rien d'autre. */
  const fakeFrames = () =>
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });

  it('devrait glisser vers le zoom demandé en quelques images, puis s’y poser', () => {
    fakeFrames();
    const { svg } = renderMap();

    fireEvent.keyDown(svg, { key: '+' });
    expect(svg.getAttribute('viewBox'), 'Rien ne bouge avant la première image.').toBe(
      '0 0 400 200',
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });
    const midway = view(svg).width;

    act(() => {
      vi.advanceTimersByTime(300);
    });
    const landed = view(svg).width;

    expect(midway).toBeLessThan(400);
    expect(midway, 'À mi-course, la vue est entre les deux.').toBeGreaterThan(landed);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(view(svg).width, 'Arrivée, la vue ne bouge plus.').toBe(landed);
  });

  it('devrait sauter directement au zoom quand on demande moins d’animation', () => {
    fakeFrames();
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));
    const { svg } = renderMap();

    fireEvent.keyDown(svg, { key: '+' });

    expect(view(svg).width, 'Aucune image à attendre.').toBeLessThan(400);
  });

  it('devrait arrêter l’animation en cours quand on glisse la carte', () => {
    fakeFrames();
    const { svg } = renderMap();
    layOut(svg);

    fireEvent.keyDown(svg, { key: '+' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.pointerDown(svg, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 140, clientY: 100, pointerId: 1 });
    const grabbed = svg.getAttribute('viewBox');
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(svg.getAttribute('viewBox'), 'Le doigt a repris la main sur l’animation.').toBe(grabbed);
  });
});
