import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Carousel, CarouselSlide, type CarouselProps } from './Carousel';
import { nearestSlide, visibleSlides } from './carousel-geometry';

/* =============================================================================
   LE CARROUSEL, MESURÉ CONTRE LE MOTIF « CAROUSEL » DE L'APG.

   jsdom n'a ni mise en page ni défilement : `scrollTo` est une espionne,
   `matchMedia` une préférence qu'on choisit, et le calcul de ce qui est à
   l'écran — pur — se teste à part, rectangles en main. Le rendu serveur se
   fait sans `window` ni `document`, puis s'hydrate sous `StrictMode`.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NAMES = ['Button', 'Textarea', 'Popover'];

const renderCarousel = (props: Partial<CarouselProps> = {}) =>
  render(
    <Carousel label="Composants d'Opale" {...props}>
      {NAMES.map((name) => (
        <CarouselSlide key={name}>
          <h3>{name}</h3>
          <a href={`#${name}`}>Voir {name}</a>
        </CarouselSlide>
      ))}
    </Carousel>,
  );

const region = () => screen.getByRole('region', { name: "Composants d'Opale" });
const track = () => document.querySelector<HTMLElement>('.opale-carousel__track')!;
const slides = () =>
  screen.getAllByRole('group').filter((node) => node.matches('.opale-carousel__slide'));
const dots = () =>
  within(screen.getByRole('group', { name: 'Choisir une diapositive' })).getAllByRole('button');
const liveRegion = () => region().querySelector<HTMLElement>('[aria-live]')!;

const scrollTo = vi.fn();
let reducedMotion = false;

beforeEach(() => {
  scrollTo.mockClear();
  reducedMotion = false;
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo });
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') && reducedMotion,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
});

describe('la géométrie du carrousel', () => {
  const trackRect = { left: 0, right: 300 };
  const rects = [
    { left: 0, right: 234 },
    { left: 250, right: 484 },
    { left: 500, right: 734 },
  ];

  it('garde à l’écran les diapositives qui en touchent une part', () => {
    expect(visibleSlides(trackRect, rects)).toEqual([0, 1]);
  });

  it('écarte celles qui ne dépassent que de la tolérance', () => {
    expect(visibleSlides({ left: 0, right: 253 }, rects)).toEqual([0]);
    expect(visibleSlides({ left: 497, right: 797 }, rects)).toEqual([2]);
  });

  it('tient tout pour visible sans mise en page', () => {
    expect(
      visibleSlides({ left: 0, right: 0 }, [
        { left: 0, right: 0 },
        { left: 0, right: 0 },
      ]),
    ).toEqual([0, 1]);
  });

  it('trouve la diapositive la plus proche du bord de départ, dans les deux sens', () => {
    expect(nearestSlide({ left: 240, right: 540 }, rects, false)).toBe(1);
    /* De droite à gauche, le départ est le bord droit. */
    expect(
      nearestSlide(
        { left: 0, right: 300 },
        [
          { left: 66, right: 300 },
          { left: -184, right: 50 },
        ],
        true,
      ),
    ).toBe(0);
  });
});

describe('Carousel — sémantique', () => {
  it('est une région nommée, et chaque diapositive un groupe numéroté', () => {
    renderCarousel();
    expect(region()).toHaveAttribute('aria-roledescription', 'carrousel');
    expect(region()).toHaveClass('opale-carousel');
    expect(track()).toHaveAttribute('tabindex', '0');
    expect(slides().map((slide) => slide.getAttribute('aria-label'))).toEqual([
      '1 sur 3',
      '2 sur 3',
      '3 sur 3',
    ]);
    for (const slide of slides())
      expect(slide).toHaveAttribute('aria-roledescription', 'diapositive');
  });

  it('rend des flèches natives, désactivées aux extrémités', () => {
    renderCarousel();
    const previous = screen.getByRole('button', { name: 'Diapositive précédente' });
    const next = screen.getByRole('button', { name: 'Diapositive suivante' });
    expect(previous).toHaveAttribute('type', 'button');
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
  });

  it('désactive « suivante » sur la dernière diapositive', () => {
    renderCarousel({ defaultValue: 2 });
    expect(screen.getByRole('button', { name: 'Diapositive suivante' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Diapositive précédente' })).toBeEnabled();
  });

  it('marque le point actif et annonce poliment un changement voulu', () => {
    const onValueChange = vi.fn();
    renderCarousel({ onValueChange });
    expect(dots().map((dot) => dot.getAttribute('aria-current'))).toEqual(['true', null, null]);
    expect(dots()[2]).toHaveAccessibleName('Aller à la diapositive 3');
    expect(liveRegion()).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion()).toHaveTextContent('');

    fireEvent.click(screen.getByRole('button', { name: 'Diapositive suivante' }));

    expect(onValueChange).toHaveBeenLastCalledWith(1);
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
    expect(liveRegion()).toHaveTextContent('2 sur 3');
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }));
  });

  it('va à la diapositive d’un point', () => {
    renderCarousel();
    fireEvent.click(dots()[2]);
    expect(dots()[2]).toHaveAttribute('aria-current', 'true');
    expect(liveRegion()).toHaveTextContent('3 sur 3');
  });

  it('obéit à une valeur contrôlée', () => {
    function Controlled() {
      const [value, setValue] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setValue(2)}>
            Dernière
          </button>
          <Carousel label="Contrôlé" value={value} onValueChange={setValue}>
            <CarouselSlide>A</CarouselSlide>
            <CarouselSlide>B</CarouselSlide>
            <CarouselSlide>C</CarouselSlide>
          </Carousel>
        </>
      );
    }
    render(<Controlled />);
    scrollTo.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Dernière' }));
    expect(scrollTo).toHaveBeenCalled();
    expect(dots()[2]).toHaveAttribute('aria-current', 'true');
  });

  it('remplace ses textes clé par clé', () => {
    renderCarousel({
      labels: { next: 'Next slide', slide: (index, total) => `${index} of ${total}` },
    });
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diapositive précédente' })).toBeInTheDocument();
    expect(slides()[0]).toHaveAttribute('aria-label', '1 of 3');
  });

  it('pose la taille et l’écart des diapositives en propriétés personnalisées', () => {
    renderCarousel({ slideSize: '12rem', gap: 'lg', className: 'extra', style: { color: 'red' } });
    expect(region()).toHaveClass('extra');
    expect(region().style.getPropertyValue('--opale-carousel-slide-size')).toBe('12rem');
    expect(region().style.getPropertyValue('--opale-carousel-gap')).toBe('var(--opale-space-lg)');
    expect(region().style.color).toBe('red');
  });

  it('transmet la ref à la racine', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Carousel label="Ref" ref={ref}>
        <CarouselSlide>A</CarouselSlide>
      </Carousel>,
    );
    expect(ref.current).toBe(screen.getByRole('region', { name: 'Ref' }));
  });
});

describe('Carousel — clavier', () => {
  it('va et vient aux flèches, Début et Fin', () => {
    renderCarousel();
    track().focus();
    fireEvent.keyDown(track(), { key: 'ArrowRight' });
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
    fireEvent.keyDown(track(), { key: 'End' });
    expect(dots()[2]).toHaveAttribute('aria-current', 'true');
    fireEvent.keyDown(track(), { key: 'ArrowLeft' });
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
    fireEvent.keyDown(track(), { key: 'Home' });
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
  });

  it('inverse les flèches de droite à gauche', () => {
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Carousel label="RTL">
          <CarouselSlide>A</CarouselSlide>
          <CarouselSlide>B</CarouselSlide>
        </Carousel>
      </div>,
    );
    const rtlTrack = screen
      .getByRole('region', { name: 'RTL' })
      .querySelector<HTMLElement>('.opale-carousel__track')!;
    fireEvent.keyDown(rtlTrack, { key: 'ArrowLeft' });
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
    fireEvent.keyDown(rtlTrack, { key: 'ArrowRight' });
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
  });

  it('laisse les flèches aux champs des diapositives', () => {
    render(
      <Carousel label="Champ">
        <CarouselSlide>
          <input aria-label="Nom" />
        </CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
      </Carousel>,
    );
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Nom' }), { key: 'ArrowRight' });
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
  });
});

describe('Carousel — hors de l’écran, inerte', () => {
  it('rend inertes les diapositives entièrement hors de la piste', () => {
    const rectOf = (left: number, right: number) => ({
      left,
      right,
      top: 0,
      bottom: 100,
      width: right - left,
      height: 100,
      x: left,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.matches('.opale-carousel__track')) return rectOf(0, 300);
      const index = [...(this.parentElement?.children ?? [])].indexOf(this);
      return rectOf(index * 250, index * 250 + 234);
    });
    renderCarousel();
    expect(slides().map((slide) => slide.hasAttribute('inert'))).toEqual([false, false, true]);
  });
});

describe('Carousel — mouvement réduit', () => {
  it('défile sans animation', () => {
    reducedMotion = true;
    renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Diapositive suivante' }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' }));
  });

  it('ne lance jamais la lecture automatique', () => {
    vi.useFakeTimers();
    reducedMotion = true;
    renderCarousel({ autoPlay: 1000 });
    act(() => vi.advanceTimersByTime(5000));
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Lire' })).toBeInTheDocument();
  });
});

describe('Carousel — lecture automatique', () => {
  beforeEach(() => vi.useFakeTimers());

  it('avance, boucle après la dernière, et ne l’annonce pas', () => {
    renderCarousel({ autoPlay: 1000 });
    act(() => vi.advanceTimersByTime(1000));
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
    expect(liveRegion()).toHaveTextContent('');
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
  });

  it('se met en pause et reprend au bouton', () => {
    renderCarousel({ autoPlay: 1000 });
    fireEvent.click(screen.getByRole('button', { name: 'Mettre en pause' }));
    act(() => vi.advanceTimersByTime(3000));
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Lire' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
  });

  it('n’a pas de bouton de lecture sans autoPlay', () => {
    renderCarousel();
    expect(screen.queryByRole('button', { name: 'Mettre en pause' })).not.toBeInTheDocument();
  });

  it('s’arrête sous le pointeur', () => {
    renderCarousel({ autoPlay: 1000 });
    fireEvent.pointerOver(track(), { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(3000));
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    fireEvent.pointerOut(track(), { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(1000));
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
  });

  it('s’arrête tant que le focus est dedans', () => {
    render(
      <>
        <Carousel label="Focus" autoPlay={1000}>
          <CarouselSlide>A</CarouselSlide>
          <CarouselSlide>B</CarouselSlide>
          <CarouselSlide>C</CarouselSlide>
        </Carousel>
        <button type="button">Dehors</button>
      </>,
    );
    act(() => track().focus());
    act(() => vi.advanceTimersByTime(3000));
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    act(() => screen.getByRole('button', { name: 'Dehors' }).focus());
    act(() => vi.advanceTimersByTime(1000));
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
  });
});

describe('Carousel — glisser à la souris', () => {
  it('fait défiler la piste et avale le clic qui termine le geste', () => {
    const onClick = vi.fn();
    render(
      <Carousel label="Glisser">
        <CarouselSlide>
          <button type="button" onClick={onClick}>
            Ouvrir
          </button>
        </CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
      </Carousel>,
    );
    let scrollLeft = 100;
    Object.defineProperty(track(), 'scrollLeft', {
      configurable: true,
      get: () => scrollLeft,
      set: (next: number) => {
        scrollLeft = next;
      },
    });
    const button = screen.getByRole('button', { name: 'Ouvrir' });
    fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0, clientX: 200 });
    fireEvent.pointerMove(button, { pointerType: 'mouse', clientX: 140 });
    expect(scrollLeft).toBe(160);
    fireEvent.pointerUp(button, { pointerType: 'mouse', clientX: 140 });
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('laisse le toucher au défilement natif', () => {
    renderCarousel();
    let scrollLeft = 0;
    Object.defineProperty(track(), 'scrollLeft', {
      configurable: true,
      get: () => scrollLeft,
      set: (next: number) => {
        scrollLeft = next;
      },
    });
    fireEvent.pointerDown(track(), { pointerType: 'touch', button: 0, clientX: 200 });
    fireEvent.pointerMove(track(), { pointerType: 'touch', clientX: 100 });
    expect(scrollLeft).toBe(0);
  });
});

describe('Carousel — rendu serveur', () => {
  const fixture = () => (
    <Carousel label="Serveur" autoPlay={4000}>
      <CarouselSlide>Un</CarouselSlide>
      <CarouselSlide>Deux</CarouselSlide>
      <CarouselSlide>Trois</CarouselSlide>
    </Carousel>
  );

  const renderOnServer = () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      return renderToString(fixture());
    } finally {
      vi.unstubAllGlobals();
    }
  };

  it('rend chaque diapositive, dans l’ordre, visible et sans statut', () => {
    const html = renderOnServer();
    expect(html.indexOf('Un')).toBeLessThan(html.indexOf('Deux'));
    expect(html.indexOf('Deux')).toBeLessThan(html.indexOf('Trois'));
    expect(html).not.toContain('inert');
    expect(html).not.toMatch(/\shidden[=\s>]/);
    expect(html).not.toMatch(/opacity:\s*0/);
    const host = document.createElement('div');
    host.innerHTML = html;
    expect(host.querySelectorAll('.opale-carousel__slide')).toHaveLength(3);
    expect(host.querySelector('[aria-live]')?.textContent).toBe('');
  });

  it('s’hydrate sans écart sous StrictMode', async () => {
    const host = document.createElement('div');
    host.innerHTML = renderOnServer();
    document.body.append(host);
    const errors: string[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, <StrictMode>{fixture()}</StrictMode>, {
          onRecoverableError: (error) => errors.push(String(error)),
        });
      });
    } finally {
      consoleError.mockRestore();
    }
    expect(errors).toEqual([]);
    await act(async () => root?.unmount());
    host.remove();
  });
});
