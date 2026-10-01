import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode, useEffect, useState } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Carousel, CarouselSlide, type CarouselProps } from './Carousel';
import { declaration, declarations } from '../../../test/css-rules';
import { nearestStop, slideOffsets, slideStops, visibleSlides } from './carousel-geometry';
import sheet from './style/Carousel.module.css?raw';

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
const liveRegion = () => document.querySelector<HTMLElement>('.opale-carousel__status')!;

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
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
  for (const key of ['scrollLeft', 'scrollWidth', 'clientWidth']) {
    Reflect.deleteProperty(HTMLElement.prototype, key);
  }
  FakeResizeObserver.all.clear();
});

/* Un `ResizeObserver` qu'on déclenche à la main. */
class FakeResizeObserver {
  static readonly all = new Set<FakeResizeObserver>();
  private readonly callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
    FakeResizeObserver.all.add(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    FakeResizeObserver.all.delete(this);
  }
  static fire() {
    for (const observer of FakeResizeObserver.all) observer.callback();
  }
}

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

/* UNE MISE EN PAGE SIMULÉE : des diapositives de `slide` px espacées de
   `gap`, dans une piste de `width` px. `scrollTo` déplace la piste et émet
   `scroll`, sauf avec `moves: false` (un défilement fluide pas encore arrivé).
   Les images d'animation sont jouées sur-le-champ. */
function mockLayout({ width = 814, slide = 352, gap = 16, moves = true } = {}) {
  const state = { scrollLeft: 0, width };
  const isTrack = (node: Element) => node.classList.contains('opale-carousel__track');
  const content = (track: Element) => track.children.length * (slide + gap) - gap;
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 0;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (isTrack(this)) return rectOf(0, state.width);
    const parent = this.parentElement;
    if (!parent || !isTrack(parent)) return rectOf(0, 0);
    const left = [...parent.children].indexOf(this) * (slide + gap) - state.scrollLeft;
    return rectOf(left, left + slide);
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
    configurable: true,
    get(this: HTMLElement) {
      return isTrack(this) ? state.scrollLeft : 0;
    },
    set(this: HTMLElement, next: number) {
      if (isTrack(this)) state.scrollLeft = next;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return isTrack(this) ? Math.max(content(this), state.width) : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return isTrack(this) ? state.width : 0;
    },
  });
  scrollTo.mockImplementation(function (this: HTMLElement, options: ScrollToOptions) {
    /* Une piste sans largeur (masquée) ne défile pas. */
    if (!moves || !isTrack(this) || state.width === 0) return;
    const max = Math.max(0, content(this) - state.width);
    state.scrollLeft = Math.min(Math.max(options.left ?? 0, 0), max);
    /* Un vrai événement et non `fireEvent` : `scrollTo` part aussi depuis un
       effet, où un `act` imbriqué perdrait la mise à jour. */
    this.dispatchEvent(new Event('scroll'));
  });
  return state;
}

const SIX = ['Button', 'Textarea', 'Popover', 'DataTable', 'Carousel', 'SplitHeading'];
const renderSix = (props: Partial<CarouselProps> = {}) =>
  render(
    <Carousel label="Six" {...props}>
      {SIX.map((name) => (
        <CarouselSlide key={name}>{name}</CarouselSlide>
      ))}
    </Carousel>,
  );

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

  it('place chaque diapositive à sa position de défilement, dans les deux sens', () => {
    expect(slideOffsets({ left: 0, right: 300 }, rects, 40, false)).toEqual([40, 290, 540]);
    /* De droite à gauche, le départ est le bord droit et le défilement se
       compte en valeur absolue. */
    expect(
      slideOffsets(
        { left: 0, right: 300 },
        [
          { left: 66, right: 300 },
          { left: -184, right: 50 },
        ],
        0,
        true,
      ),
    ).toEqual([0, 250]);
  });

  /* Revue : six diapositives dont 3,4 tiennent à l'écran. Les deux dernières
     ne peuvent pas venir au bord de départ : le défilement s'arrête au bout. */
  it('réunit les positions inatteignables en une seule, au bout de la piste', () => {
    const stops = slideStops([0, 368, 736, 1104, 1472, 1840], 1378);
    expect(stops.map((stop) => stop.index)).toEqual([0, 1, 2, 3, 5]);
    expect(stops[4]).toEqual({ position: 1378, first: 4, last: 5, index: 5 });
  });

  it('n’a qu’une position quand tout tient, et c’est la première', () => {
    expect(slideStops([0, 250, 500], 0)).toEqual([{ position: 0, first: 0, last: 2, index: 0 }]);
  });

  it('trouve la position la plus proche du défilement', () => {
    const stops = slideStops([0, 368, 736, 1104, 1472, 1840], 1378);
    expect(nearestStop(stops, 500)).toBe(1);
    expect(nearestStop(stops, 1378)).toBe(4);
    expect(nearestStop([], 10)).toBe(0);
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

  /* Un fragment est l'enveloppe la plus courante : ses diapositives comptent
     une à une, comme si elles étaient passées directement. */
  it('déplie les fragments et numérote chaque diapositive qu’ils contiennent', () => {
    render(
      <Carousel label="Projets">
        <>
          <CarouselSlide>Un</CarouselSlide>
          <CarouselSlide>Deux</CarouselSlide>
        </>
        <CarouselSlide>Trois</CarouselSlide>
      </Carousel>,
    );
    expect(slides().map((slide) => slide.getAttribute('aria-label'))).toEqual([
      '1 sur 3',
      '2 sur 3',
      '3 sur 3',
    ]);
    expect(dots()).toHaveLength(3);
  });

  /* Un composant qui rend les diapositives cache leur nombre au carrousel :
     il le dit en développement, plutôt que de tout réduire à une position. */
  it('avertit en développement quand il mesure plus de diapositives que d’enfants', () => {
    mockLayout();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    function Wrapped() {
      return (
        <>
          <CarouselSlide>Un</CarouselSlide>
          <CarouselSlide>Deux</CarouselSlide>
        </>
      );
    }
    render(
      <Carousel label="Projets">
        <Wrapped />
      </Carousel>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('CarouselSlide'));
    warn.mockRestore();
  });

  it('rend des flèches natives, désactivées aux extrémités', () => {
    renderCarousel();
    const previous = screen.getByRole('button', { name: 'Diapositive précédente' });
    const next = screen.getByRole('button', { name: 'Diapositive suivante' });
    expect(previous).toHaveAttribute('type', 'button');
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(next).not.toHaveAttribute('aria-disabled');
  });

  /* WCAG 2.4.3 : un bouton `disabled` qui a le focus le perd vers `<body>`. */
  it('garde le focus sur la flèche qui atteint l’extrémité, sans rien faire de plus', () => {
    const onValueChange = vi.fn();
    renderCarousel({ onValueChange });
    const next = screen.getByRole('button', { name: 'Diapositive suivante' });
    next.focus();
    fireEvent.click(next);
    fireEvent.click(next);
    expect(next).not.toBeDisabled();
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).toHaveFocus();
    onValueChange.mockClear();
    fireEvent.click(next);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(dots()[2]).toHaveAttribute('aria-current', 'true');
  });

  it('désactive « suivante » sur la dernière diapositive', () => {
    renderCarousel({ defaultValue: 2 });
    expect(screen.getByRole('button', { name: 'Diapositive suivante' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Diapositive précédente' })).not.toHaveAttribute(
      'aria-disabled',
    );
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

  it('laisse passer les flèches modifiées (Alt+← revient en arrière)', () => {
    renderCarousel();
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
      const event = createEvent.keyDown(track(), { key: 'ArrowRight', [modifier]: true });
      fireEvent(track(), event);
      expect(event.defaultPrevented).toBe(false);
    }
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

  /* Revue : la mesure faite à deux diapositives rendait inerte toute
     diapositive ajoutée ensuite, et rien ne remesurait. */
  it('remesure quand des diapositives arrivent après le montage', () => {
    mockLayout({ width: 1200 });
    const { rerender } = render(
      <Carousel label="Ajout">
        <CarouselSlide key="a">A</CarouselSlide>
        <CarouselSlide key="b">B</CarouselSlide>
      </Carousel>,
    );
    rerender(
      <Carousel label="Ajout">
        <CarouselSlide key="a">A</CarouselSlide>
        <CarouselSlide key="b">B</CarouselSlide>
        <CarouselSlide key="c">C</CarouselSlide>
        <CarouselSlide key="d">D</CarouselSlide>
      </Carousel>,
    );
    expect(slides().map((slide) => slide.hasAttribute('inert'))).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('ne rend rien inerte tant qu’une piste vide n’a rien mesuré', () => {
    mockLayout({ width: 1200 });
    const { rerender } = render(<Carousel label="Vide">{[]}</Carousel>);
    rerender(
      <Carousel label="Vide">
        <CarouselSlide key="a">A</CarouselSlide>
      </Carousel>,
    );
    expect(slides()[0]).not.toHaveAttribute('inert');
  });

  /* Revue : seule la fenêtre était écoutée. Une piste masquée au montage
     (onglet, `display: none`) qui prend sa largeur doit rejoindre sa valeur. */
  it('rejoint la valeur de départ quand la piste prend sa largeur', () => {
    const layout = mockLayout({ width: 0 });
    renderSix({ defaultValue: 2 });
    scrollTo.mockClear();
    layout.width = 814;
    act(() => FakeResizeObserver.fire());
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 736, behavior: 'auto' }));
  });
});

describe('Carousel — positions atteignables', () => {
  /* 814 px de piste, diapositives de 352 px tous les 368 px : le bout est à
     1 378 px, et les diapositives 5 et 6 y arrivent ensemble. */
  const next = () => screen.getByRole('button', { name: 'Diapositive suivante' });

  it('n’offre qu’un point par position atteignable', () => {
    mockLayout();
    renderSix();
    expect(dots()).toHaveLength(5);
    expect(dots()[4]).toHaveAccessibleName('Aller à la diapositive 6');
  });

  it('va au bout, annonce ce qui est atteint, puis revient d’une position', () => {
    const layout = mockLayout();
    const onValueChange = vi.fn();
    renderSix({ onValueChange });
    fireEvent.keyDown(track(), { key: 'End' });
    expect(layout.scrollLeft).toBe(1378);
    expect(onValueChange.mock.calls).toEqual([[5]]);
    expect(liveRegion()).toHaveTextContent('6 sur 6');
    expect(next()).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Diapositive précédente' }));
    expect(layout.scrollLeft).toBe(1104);
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(liveRegion()).toHaveTextContent('4 sur 6');
  });

  /* Revue : `go(4)` depuis 5 ne défilait pas, la minuterie remesurait et la
     valeur retombait à 5 après avoir annoncé « 5 sur 6 ». */
  it('ne vise jamais une position que le défilement corrigerait', () => {
    vi.useFakeTimers();
    const layout = mockLayout();
    const onValueChange = vi.fn();
    renderSix({ onValueChange });
    fireEvent.keyDown(track(), { key: 'End' });
    onValueChange.mockClear();
    fireEvent.click(dots()[4]);
    act(() => vi.advanceTimersByTime(1500));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(layout.scrollLeft).toBe(1378);
    expect(liveRegion()).toHaveTextContent('6 sur 6');
  });

  it('montre une valeur de départ inatteignable sans la changer', () => {
    const layout = mockLayout();
    const onValueChange = vi.fn();
    renderSix({ defaultValue: 4, onValueChange });
    expect(layout.scrollLeft).toBe(1378);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(dots()[4]).toHaveAttribute('aria-current', 'true');
    expect(next()).toHaveAttribute('aria-disabled', 'true');
  });

  it('boucle en lecture automatique sur les positions atteignables', () => {
    vi.useFakeTimers();
    mockLayout();
    const onValueChange = vi.fn();
    renderSix({ autoPlay: 1000, onValueChange });
    for (let step = 0; step < 6; step += 1) act(() => vi.advanceTimersByTime(1000));
    expect(onValueChange.mock.calls.flat()).toEqual([1, 2, 3, 5, 0, 1]);
  });

  it('ne rappelle rien quand la diapositive ne change pas', () => {
    mockLayout();
    const onValueChange = vi.fn();
    renderSix({ onValueChange });
    fireEvent.keyDown(track(), { key: 'Home' });
    fireEvent.click(dots()[0]);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(liveRegion()).toHaveTextContent('');
  });

  /* Revue : chaque diapositive traversée pendant le geste rappelait
     l'appelant ; le geste n'en rappelle qu'une, au lâcher. */
  it('ne rappelle qu’une fois par glisser, au lâcher', () => {
    const layout = mockLayout();
    const onValueChange = vi.fn();
    renderSix({ onValueChange });
    fireEvent.pointerDown(track(), { pointerType: 'mouse', button: 0, buttons: 1, clientX: 700 });
    for (const clientX of [500, 300, 100]) {
      fireEvent.pointerMove(track(), { pointerType: 'mouse', buttons: 1, clientX });
      fireEvent.scroll(track());
    }
    expect(layout.scrollLeft).toBe(600);
    fireEvent.pointerUp(track(), { pointerType: 'mouse', clientX: 100 });
    expect(onValueChange.mock.calls).toEqual([[2]]);
  });

  it('arrondit une valeur non entière et ignore une valeur absurde', () => {
    const { rerender } = render(
      <Carousel label="Valeur" value={1.6}>
        <CarouselSlide>A</CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
        <CarouselSlide>C</CarouselSlide>
      </Carousel>,
    );
    expect(dots()[2]).toHaveAttribute('aria-current', 'true');
    rerender(
      <Carousel label="Valeur" value={Number.NaN}>
        <CarouselSlide>A</CarouselSlide>
        <CarouselSlide>B</CarouselSlide>
        <CarouselSlide>C</CarouselSlide>
      </Carousel>,
    );
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    expect(slides()[0]).toHaveAttribute('aria-label', '1 sur 3');
  });

  it('reste où le parent le tient quand il refuse le changement', () => {
    const layout = mockLayout();
    const onValueChange = vi.fn();
    renderSix({ value: 0, onValueChange });
    fireEvent.click(next());
    expect(onValueChange).toHaveBeenCalledWith(1);
    expect(layout.scrollLeft).toBe(0);
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    expect(liveRegion()).toHaveTextContent('');
  });
});

describe('Carousel — rappels de l’appelant', () => {
  /* Revue : un `onValueChange` écrit en ligne changeait l'identité des
     rappels ; le nettoyage de l'effet de mesure effaçait la minuterie qui
     libère la cible, et le défilement natif était ignoré pour toujours. */
  it('suit encore le défilement natif quand le parent rend à chaque changement', () => {
    vi.useFakeTimers();
    const layout = mockLayout({ moves: false });
    function Parent() {
      const [, setCount] = useState(0);
      return (
        <Carousel label="Parent" onValueChange={() => setCount((count) => count + 1)}>
          {SIX.map((name) => (
            <CarouselSlide key={name}>{name}</CarouselSlide>
          ))}
        </Carousel>
      );
    }
    render(<Parent />);
    fireEvent.click(screen.getByRole('button', { name: 'Diapositive suivante' }));
    act(() => vi.advanceTimersByTime(1000));
    layout.scrollLeft = 736;
    fireEvent.scroll(track());
    expect(dots()[2]).toHaveAttribute('aria-current', 'true');
  });

  /* Revue : la minuterie de lecture dépendait de `go`, recréé à chaque rendu
     du parent : un parent qui rend souvent l'affamait. */
  it('avance malgré un parent qui rend plus souvent que l’intervalle', () => {
    vi.useFakeTimers();
    function Ticking() {
      const [tick, setTick] = useState(0);
      useEffect(() => {
        const id = setInterval(() => setTick((value) => value + 1), 300);
        return () => clearInterval(id);
      }, []);
      return (
        <Carousel label={`Tic ${tick % 1}`} autoPlay={1000} onValueChange={() => {}}>
          <CarouselSlide>A</CarouselSlide>
          <CarouselSlide>B</CarouselSlide>
          <CarouselSlide>C</CarouselSlide>
        </Carousel>
      );
    }
    render(<Ticking />);
    /* Pas à pas : chaque rendu du parent doit avoir lieu avant l'échéance. */
    for (let step = 0; step < 11; step += 1) act(() => vi.advanceTimersByTime(100));
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
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

  /* Revue : une diapositive devenue inerte perd le focus sans `focusout` ;
     la pause restait tenue pour toujours. */
  it('reprend quand le focus a quitté le carrousel sans événement', () => {
    mockLayout({ width: 1200 });
    renderSix({ autoPlay: 1000 });
    act(() => track().focus());
    act(() => vi.advanceTimersByTime(2000));
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(document.body);
    fireEvent.scroll(track());
    act(() => vi.advanceTimersByTime(1000));
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
  });

  it('s’arrête tant que la page est cachée', () => {
    renderCarousel({ autoPlay: 1000 });
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => vi.advanceTimersByTime(3000));
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    visibility.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
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
    fireEvent.pointerMove(button, { pointerType: 'mouse', buttons: 1, clientX: 140 });
    expect(scrollLeft).toBe(160);
    fireEvent.pointerUp(button, { pointerType: 'mouse', clientX: 140 });
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /* Revue : un bouton relâché hors de la piste, avant le seuil, laissait le
     geste actif ; le simple survol faisait ensuite défiler. */
  it('abandonne le geste quand plus aucun bouton n’est enfoncé', () => {
    const layout = mockLayout();
    renderSix();
    fireEvent.pointerDown(track(), { pointerType: 'mouse', button: 0, buttons: 1, clientX: 200 });
    fireEvent.pointerMove(track(), { pointerType: 'mouse', buttons: 1, clientX: 198 });
    fireEvent.pointerMove(track(), { pointerType: 'mouse', buttons: 0, clientX: 100 });
    fireEvent.pointerMove(track(), { pointerType: 'mouse', buttons: 0, clientX: 40 });
    expect(layout.scrollLeft).toBe(0);
    expect(track()).not.toHaveAttribute('data-dragging');
  });

  it('termine le geste quand la capture du pointeur est perdue', () => {
    const layout = mockLayout({ moves: false });
    renderSix();
    fireEvent.pointerDown(track(), { pointerType: 'mouse', button: 0, buttons: 1, clientX: 300 });
    fireEvent.pointerMove(track(), { pointerType: 'mouse', buttons: 1, clientX: 250 });
    expect(layout.scrollLeft).toBe(50);
    fireEvent.lostPointerCapture(track(), { pointerType: 'mouse' });
    fireEvent.pointerMove(track(), { pointerType: 'mouse', buttons: 1, clientX: 100 });
    expect(layout.scrollLeft).toBe(50);
  });

  it('survit à une capture refusée et efface la sélection au seuil', () => {
    const layout = mockLayout();
    const removeAllRanges = vi.fn();
    vi.spyOn(window, 'getSelection').mockReturnValue({ removeAllRanges } as unknown as Selection);
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: () => {
        throw new DOMException('Pointeur inconnu', 'NotFoundError');
      },
    });
    try {
      renderSix();
      fireEvent.pointerDown(track(), { pointerType: 'mouse', button: 0, buttons: 1, clientX: 300 });
      fireEvent.pointerMove(track(), { pointerType: 'mouse', buttons: 1, clientX: 200 });
      expect(layout.scrollLeft).toBe(100);
      expect(removeAllRanges).toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'setPointerCapture');
    }
  });

  /* Revue : l'aimant rétabli au lâcher se disputait le défilement avec le
     calage programmé ; il ne revient qu'une fois le calage fini. */
  it('garde l’aimant coupé jusqu’à la fin du calage', () => {
    vi.useFakeTimers();
    mockLayout({ moves: false });
    renderSix();
    fireEvent.pointerDown(track(), { pointerType: 'mouse', button: 0, buttons: 1, clientX: 300 });
    fireEvent.pointerMove(track(), { pointerType: 'mouse', buttons: 1, clientX: 100 });
    fireEvent.pointerUp(track(), { pointerType: 'mouse', clientX: 100 });
    expect(track()).toHaveAttribute('data-dragging');
    act(() => vi.advanceTimersByTime(1000));
    expect(track()).not.toHaveAttribute('data-dragging');
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

describe('Carousel — feuille et ordre', () => {
  /* WCAG 1.4.11 : à 32 %, le point inactif tombait à 2,1:1 en clair et
     2,64:1 en sombre. 55 % de l'encre sur la surface donne 4,16:1 (#14100b
     sur #ffffff) et 4,91:1 (#f3f1ec sur #262c27). */
  it('donne aux points inactifs au moins 3:1 dans les deux thèmes', () => {
    expect(Number(declaration(sheet, '.dot::before', 'opacity'))).toBeGreaterThanOrEqual(0.55);
    expect(Number(declaration(sheet, '.dot:hover::before', 'opacity'))).toBeGreaterThanOrEqual(
      0.75,
    );
  });

  it('distingue le point actif par sa forme en contrastes forcés', () => {
    const within = '@media (forced-colors: active)';
    const inactive = declarations(sheet, '.dot::before', { within });
    expect(inactive.get('background')).toBe('Canvas');
    expect(inactive.get('border')).toContain('CanvasText');
    expect(declaration(sheet, ".dot[aria-current='true']::before", 'background', { within })).toBe(
      'Highlight',
    );
  });

  /* Revue : le build de la vitrine réécrit `:dir(rtl)` en `:lang(ar…)` ; une
     page `dir="rtl"` en `lang="fr"` gardait ← sur « précédente ». */
  it('retourne les flèches de droite à gauche par un attribut posé au script', () => {
    mockLayout();
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Carousel label="RTL">
          <CarouselSlide>A</CarouselSlide>
          <CarouselSlide>B</CarouselSlide>
          <CarouselSlide>C</CarouselSlide>
        </Carousel>
      </div>,
    );
    expect(screen.getByRole('region', { name: 'RTL' })).toHaveAttribute('data-dir', 'rtl');
    expect(declaration(sheet, ".root[data-dir='rtl'] .arrow", 'scale')).toBe('-1 1');
  });

  it('place le bouton pause avant la piste dans l’ordre de tabulation (APG)', () => {
    renderCarousel({ autoPlay: 4000 });
    const pause = screen.getByRole('button', { name: 'Mettre en pause' });
    expect(pause.compareDocumentPosition(track()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
