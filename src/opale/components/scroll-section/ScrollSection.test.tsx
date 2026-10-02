import { act, render, screen } from '@testing-library/react';
import { createRef, Fragment, StrictMode, type ReactNode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollSection, ScrollStage, type ScrollGround, type ScrollStageProps } from '.';
import { declaration, declarations, selectorsDeclaring } from '../../../test/css-rules';
import sheet from './style/ScrollSection.module.css?raw';
import opaleSource from '../../opale.css?raw';

/* =============================================================================
   LA SCÈNE ET SES SECTIONS, MESURÉES CONTRE LEURS CRITÈRES.

   jsdom n'a ni mise en page ni défilement : chaque section reçoit une
   position dans le document (`layout`), `getBoundingClientRect` la rend
   relative au défilement simulé (`scrollY`), la hauteur de la vue et celle du
   document sont choisies, et `requestAnimationFrame` est une file qu'on vide
   à la main. Un défilement est un événement `scroll` suivi d'une image.
   La feuille se lit par son arbre : c'est elle qui peint les fonds et qui
   fond la scène.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* La position de chaque section dans le document, par `data-testid`. */
const layout = new Map<string, { top: number; height: number }>();
let scrollY = 0;
let pageHeight = 4000;
const VIEW = 800;

/* Les images en attente, rendues à la main par `nextFrame`. */
let frames: FrameRequestCallback[] = [];
const nextFrame = () =>
  act(() => {
    const pending = frames;
    frames = [];
    for (const callback of pending) callback(0);
  });

/* Un défilement : la position change, l'événement part, l'image suit. */
const scrollTo = (y: number) => {
  scrollY = y;
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
  nextFrame();
};

beforeEach(() => {
  layout.clear();
  scrollY = 0;
  pageHeight = 4000;
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(VIEW);
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockImplementation(() => pageHeight);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const place = layout.get(this.dataset.testid ?? '') ?? { top: -1e6, height: 0 };
    const top = place.top - scrollY;
    return { top, bottom: top + place.height, height: place.height } as DOMRect;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const stage = () => screen.getByTestId('stage');
const section = (id: string) => screen.getByTestId(id);

const FOUR: readonly ScrollGround[] = ['paper', 'amber', 'night', 'blue'];

/* Quatre bandes de 1 000 px, de haut en bas d'une page de 4 000 px. */
const stack = (grounds: readonly ScrollGround[] = FOUR, height = 1000) =>
  grounds.forEach((ground, index) => layout.set(ground, { top: index * height, height }));

const scene = (props: Partial<ScrollStageProps> = {}, grounds = FOUR) => (
  <ScrollStage data-testid="stage" {...props}>
    {grounds.map((ground) => (
      <ScrollSection key={ground} ground={ground} data-testid={ground}>
        <p>{ground}</p>
      </ScrollSection>
    ))}
  </ScrollStage>
);

const renderStage = (props: Partial<ScrollStageProps> = {}, grounds = FOUR) =>
  render(scene(props, grounds));

describe('ScrollSection — rendu', () => {
  it('rend une `section` par défaut, avec sa classe stable, ses props et sa ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <ScrollSection
        ground="amber"
        ref={ref}
        className="maison"
        id="bande"
        aria-labelledby="titre"
        style={{ paddingBlock: '2rem' }}
        data-testid="amber"
      >
        <h2 id="titre">Ambre</h2>
      </ScrollSection>,
    );
    const node = section('amber');
    expect(node.tagName).toBe('SECTION');
    expect(node).toHaveClass('opale-scroll-section', 'maison');
    expect(node).toHaveAttribute('id', 'bande');
    expect(node).toHaveAttribute('aria-labelledby', 'titre');
    expect(node.style.paddingBlock).toBe('2rem');
    expect(ref.current).toBe(node);
  });

  it.each(['div', 'header', 'footer', 'article'] as const)('rend un `%s` avec `as`', (as) => {
    render(<ScrollSection ground="paper" as={as} data-testid="paper" />);
    expect(section('paper').tagName).toBe(as.toUpperCase());
  });

  it.each([
    ['paper', null],
    ['amber', 'light'],
    ['night', 'dark'],
    ['blue', 'dark'],
  ] as const)('pose `data-ground="%s"` et le thème local %s', (ground, theme) => {
    render(<ScrollSection ground={ground} data-testid={ground} />);
    expect(section(ground)).toHaveAttribute('data-ground', ground);
    if (theme === null) expect(section(ground)).not.toHaveAttribute('data-opale-page-theme');
    else expect(section(ground)).toHaveAttribute('data-opale-page-theme', theme);
  });

  it('peint son fond hors de toute scène, sans écouteur ni avertissement', () => {
    const listen = vi.spyOn(window, 'addEventListener');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ScrollSection ground="night" data-testid="night" />);
    expect(section('night')).toHaveAttribute('data-ground', 'night');
    expect(listen.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  /* Constat 6 : une ref en ligne est une nouvelle fonction à chaque rendu.
     La section n'a plus d'inscription : rien ne se refait, et la scène lit
     son fond à la mesure — un fond neuf est suivi sans remontage. */
  it('passe la ref de l’appelant, et suit un fond neuf sans remontage', () => {
    stack();
    const refs: (HTMLElement | null)[] = [];
    const Scene = ({ ground }: { ground: ScrollGround }) => (
      <ScrollStage data-testid="stage">
        <ScrollSection ground="paper" data-testid="paper" />
        <ScrollSection ground={ground} data-testid="amber" ref={(node) => void refs.push(node)} />
      </ScrollStage>
    );
    const { rerender } = render(<Scene ground="amber" />);
    const node = section('amber');
    scrollTo(800);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
    rerender(<Scene ground="night" />);
    expect(section('amber')).toBe(node);
    expect(refs.filter(Boolean).every((one) => one === node)).toBe(true);
    scrollTo(820);
    expect(stage()).toHaveAttribute('data-ground', 'night');
  });
});

describe('ScrollStage — rendu', () => {
  it('rend un `div` par défaut, avec sa classe stable, ses props et sa ref', () => {
    const ref = createRef<HTMLDivElement>();
    renderStage({ ref, className: 'maison', id: 'scene', style: { minHeight: '10rem' } });
    expect(stage().tagName).toBe('DIV');
    expect(stage()).toHaveClass('opale-scroll-stage', 'maison');
    expect(stage()).toHaveAttribute('id', 'scene');
    expect(stage().style.minHeight).toBe('10rem');
    expect(ref.current).toBe(stage());
  });

  it.each(['main', 'article'] as const)('rend un `%s` avec `as`', (as) => {
    renderStage({ as });
    expect(stage().tagName).toBe(as.toUpperCase());
  });
});

/* Constat 5 : le fond de départ, lu au rendu. */
describe('ScrollStage — le fond de départ', () => {
  const html = (children: ReactNode, props: Partial<ScrollStageProps> = {}) => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      return renderToString(<ScrollStage {...props}>{children}</ScrollStage>);
    } finally {
      vi.unstubAllGlobals();
    }
  };

  it('prend celui de la première ScrollSection, en sautant ce qui n’en est pas une', () => {
    expect(
      html(
        <>
          <p>Intro</p>
          <ScrollSection ground="night" />
          <ScrollSection ground="paper" />
        </>,
      ),
    ).toMatch(/^<div[^>]*data-ground="night"/);
  });

  it('descend dans les fragments, imbriqués ou en tableau', () => {
    expect(
      html(
        <Fragment>
          {[]}
          <Fragment key="a">
            <ScrollSection ground="blue" />
          </Fragment>
        </Fragment>,
      ),
    ).toMatch(/^<div[^>]*data-ground="blue"/);
  });

  it('ignore la prop `ground` d’un autre composant, et retombe sur `paper`', () => {
    const Wrapper = ({ ground }: { ground: ScrollGround }) => <ScrollSection ground={ground} />;
    expect(html(<Wrapper ground="amber" />)).toMatch(/^<div[^>]*data-ground="paper"/);
    expect(html('Rien')).toMatch(/^<div[^>]*data-ground="paper"/);
  });

  it('préfère `initialGround`, qui passe avant les enfants', () => {
    const Wrapper = () => <ScrollSection ground="amber" />;
    expect(html(<Wrapper />, { initialGround: 'amber' })).toMatch(/^<div[^>]*data-ground="amber"/);
    expect(html(<ScrollSection ground="night" />, { initialGround: 'blue' })).toMatch(
      /data-ground="blue"/,
    );
  });

  it('écrit le fond sans transition au serveur, et chaque section son couple', () => {
    const out = html(
      <>
        <ScrollSection ground="amber" />
        <ScrollSection ground="night" />
      </>,
    );
    expect(out).toMatch(/^<div[^>]*data-instant=""/);
    expect(out).toMatch(/<section[^>]*data-ground="amber"[^>]*data-opale-page-theme="light"/);
    expect(out).toMatch(/<section[^>]*data-ground="night"[^>]*data-opale-page-theme="dark"/);
    expect(out).not.toMatch(/style=/);
  });
});

describe('ScrollStage — la section active', () => {
  it('suit la section qui contient le milieu de la vue', () => {
    stack();
    renderStage();
    scrollTo(1200);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
    scrollTo(2000);
    expect(stage()).toHaveAttribute('data-ground', 'night');
  });

  /* Constat 4 : une limite exactement sur la ligne. Les intervalles sont
     demi-ouverts : la section qui COMMENCE sur la ligne la contient, quel que
     soit l'ordre d'inscription. */
  it('donne une limite posée sur la ligne à la section qui y commence', () => {
    stack(['night', 'amber', 'paper', 'blue']);
    renderStage({}, ['night', 'amber', 'paper', 'blue']);
    scrollTo(600);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
  });

  it('garde le dernier fond quand plus aucune section ne contient la ligne', () => {
    pageHeight = 8000;
    stack();
    renderStage();
    scrollTo(3000);
    expect(stage()).toHaveAttribute('data-ground', 'blue');
    scrollTo(5000);
    expect(stage()).toHaveAttribute('data-ground', 'blue');
  });

  /* Constat 1 : une bande courte au bas de la page ne croise jamais le
     milieu de la vue. Au bas du document, la dernière section visible gagne. */
  it('active une courte dernière section au bas de la page', () => {
    layout.set('paper', { top: 0, height: 1500 });
    layout.set('amber', { top: 1500, height: 2200 });
    layout.set('blue', { top: 3700, height: 300 });
    renderStage({}, ['paper', 'amber', 'blue']);
    scrollTo(3100);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
    scrollTo(3200);
    expect(stage()).toHaveAttribute('data-ground', 'blue');
  });

  /* Constat 1, en haut : un bandeau plus court que la demi-vue. En haut du
     document, la première section visible gagne. */
  it('active un court bandeau d’ouverture en haut de la page', () => {
    layout.set('night', { top: 0, height: 300 });
    layout.set('amber', { top: 300, height: 2000 });
    layout.set('paper', { top: 2300, height: 1700 });
    renderStage({}, ['night', 'amber', 'paper']);
    scrollTo(100);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
    scrollTo(0);
    expect(stage()).toHaveAttribute('data-ground', 'night');
  });

  /* Constat 2 : une section imbriquée gagne tant que la ligne est en elle,
     l'englobante reprend ensuite. */
  it('donne la ligne à la section imbriquée, puis rend la main à l’englobante', () => {
    pageHeight = 6000;
    layout.set('amber', { top: 0, height: 3000 });
    layout.set('night', { top: 1000, height: 500 });
    layout.set('blue', { top: 3000, height: 3000 });
    render(
      <ScrollStage data-testid="stage">
        <ScrollSection ground="amber" data-testid="amber">
          <ScrollSection ground="night" data-testid="night" />
        </ScrollSection>
        <ScrollSection ground="blue" data-testid="blue" />
      </ScrollStage>,
    );
    scrollTo(800);
    expect(stage()).toHaveAttribute('data-ground', 'night');
    scrollTo(1400);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
    scrollTo(2700);
    expect(stage()).toHaveAttribute('data-ground', 'blue');
  });

  it('suit aussi un redimensionnement', () => {
    stack();
    renderStage();
    scrollY = 1200;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    nextFrame();
    expect(stage()).toHaveAttribute('data-ground', 'amber');
  });

  it('ne mesure qu’une fois par image, quel que soit le nombre d’événements', () => {
    stack();
    renderStage();
    nextFrame();
    const measure = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    measure.mockClear();
    act(() => {
      for (let index = 0; index < 5; index += 1) window.dispatchEvent(new Event('scroll'));
    });
    expect(frames).toHaveLength(1);
    nextFrame();
    expect(measure).toHaveBeenCalledTimes(4);
  });

  it('prévient `onGroundChange` au changement seulement, avec le plus récent', () => {
    stack();
    const first = vi.fn();
    const onGroundChange = vi.fn();
    const { rerender } = renderStage({ onGroundChange: first });
    nextFrame();
    rerender(scene({ onGroundChange }));
    scrollTo(100);
    expect(onGroundChange).not.toHaveBeenCalled();
    scrollTo(800);
    scrollTo(900);
    expect(onGroundChange).toHaveBeenCalledTimes(1);
    expect(onGroundChange).toHaveBeenLastCalledWith('amber');
    scrollTo(1700);
    expect(onGroundChange).toHaveBeenLastCalledWith('night');
    expect(onGroundChange).toHaveBeenCalledTimes(2);
    expect(first).not.toHaveBeenCalled();
  });

  /* Constat 3 : monté au milieu de la page (défilement restauré, ancre), la
     scène prend la bonne section sans fondu et sans prévenir. */
  it('se monte sur la section du milieu sans fondu ni `onGroundChange`', () => {
    stack();
    scrollY = 1700;
    const onGroundChange = vi.fn();
    renderStage({ onGroundChange });
    expect(stage()).toHaveAttribute('data-ground', 'night');
    expect(stage()).toHaveAttribute('data-instant');
    /* La première image suit encore le montage : un défilement restauré
       juste après lui est rattrapé sans fondu. */
    scrollY = 2700;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    nextFrame();
    expect(stage()).toHaveAttribute('data-ground', 'blue');
    expect(stage()).toHaveAttribute('data-instant');
    expect(onGroundChange).not.toHaveBeenCalled();
    /* Ensuite, un vrai défilement : le fondu revient, et l'appel. */
    scrollTo(1700);
    expect(stage()).toHaveAttribute('data-ground', 'night');
    expect(stage()).not.toHaveAttribute('data-instant');
    expect(onGroundChange).toHaveBeenCalledExactlyOnceWith('night');
  });

  it('compte les sections d’une scène imbriquée comme des sections imbriquées', () => {
    stack(['paper', 'amber']);
    layout.set('inner', { top: 1000, height: 1000 });
    render(
      <ScrollStage data-testid="stage">
        <ScrollSection ground="paper" data-testid="paper" />
        <ScrollStage data-testid="inner-stage">
          <ScrollSection ground="blue" data-testid="inner" />
        </ScrollStage>
      </ScrollStage>,
    );
    scrollTo(1000);
    expect(stage()).toHaveAttribute('data-ground', 'blue');
    expect(screen.getByTestId('inner-stage')).toHaveAttribute('data-ground', 'blue');
  });

  it('retire ses écouteurs et son image en attente au démontage', () => {
    stack();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const { unmount } = renderStage();
    const added = add.mock.calls.filter(([type]) => type === 'scroll' || type === 'resize');
    expect(added.map(([type]) => type).sort()).toEqual(['resize', 'scroll']);
    unmount();
    for (const [type, listener] of added) {
      expect(remove).toHaveBeenCalledWith(type, listener);
    }
    expect(cancel).toHaveBeenCalled();
  });

  it('tient sous StrictMode : écouteurs équilibrés, un seul appel par changement', () => {
    stack();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const onGroundChange = vi.fn();
    const { unmount } = render(<StrictMode>{scene({ onGroundChange })}</StrictMode>);
    nextFrame();
    scrollTo(1700);
    expect(stage()).toHaveAttribute('data-ground', 'night');
    expect(onGroundChange).toHaveBeenCalledExactlyOnceWith('night');
    unmount();
    const count = (spy: typeof add, type: string) =>
      spy.mock.calls.filter(([one]) => one === type).length;
    expect(count(remove, 'scroll')).toBe(count(add, 'scroll'));
    expect(count(remove, 'resize')).toBe(count(add, 'resize'));
  });
});

describe('ScrollStage — hydratation', () => {
  const fixture = () => (
    <ScrollStage as="main">
      <ScrollSection ground="amber" data-testid="amber">
        <h2>Ambre</h2>
      </ScrollSection>
      <ScrollSection ground="night" data-testid="night">
        <h2>Nuit</h2>
      </ScrollSection>
    </ScrollStage>
  );

  it('s’hydrate sans écart sous StrictMode, puis prend la section du milieu sans fondu', async () => {
    layout.set('amber', { top: 0, height: 1000 });
    layout.set('night', { top: 1000, height: 3000 });
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    let markup = '';
    try {
      markup = renderToString(fixture());
    } finally {
      vi.unstubAllGlobals();
    }
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    scrollY = 1200;
    const host = document.createElement('div');
    host.innerHTML = markup;
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
    expect(host.querySelector('main')).toHaveAttribute('data-ground', 'night');
    expect(host.querySelector('main')).toHaveAttribute('data-instant');
    await act(async () => root?.unmount());
    host.remove();
  });
});

describe('ScrollSection — feuille', () => {
  it('déclare les fonds, leurs encres et la durée de la scène sur `:root`', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-ground-paper')).toBe('#fbfaf9');
    expect(root.get('--opale-ground-paper-ink')).toBe('#14100b');
    expect(root.get('--opale-ground-amber')).toBe('#f4ad15');
    expect(root.get('--opale-ground-night')).toBe('#121713');
    expect(root.get('--opale-ground-blue')).toBe('#315c9e');
    expect(root.get('--opale-stage-duration')).toBe('640ms');
  });

  it.each(FOUR)('peint la section %s de son fond et de son encre', (ground) => {
    const rule = declarations(sheet, `.section[data-ground='${ground}']`);
    expect(rule.get('background-color')).toBe(`var(--opale-ground-${ground})`);
    expect(rule.get('color')).toBe(`var(--opale-ground-${ground}-ink)`);
  });

  it.each(FOUR)('expose sur la scène le couple %s', (ground) => {
    const rule = declarations(sheet, `.stage[data-ground='${ground}']`);
    expect(rule.get('--opale-stage-ground')).toBe(`var(--opale-ground-${ground})`);
    expect(rule.get('--opale-stage-ink')).toBe(`var(--opale-ground-${ground}-ink)`);
  });

  it('peint la scène du couple actif, et ne fond que sa couleur', () => {
    const rule = declarations(sheet, '.stage');
    expect(rule.get('background-color')).toBe('var(--opale-stage-ground)');
    expect(rule.get('color')).toBe('var(--opale-stage-ink)');
    expect(rule.get('transition-property')).toBe('background-color, color');
    expect(rule.get('transition-duration')).toBe('var(--opale-stage-duration)');
    expect(rule.get('transition-timing-function')).toBe('var(--opale-ease)');
    /* La section ne s'anime jamais : son couple est juste à toute image. */
    expect(selectorsDeclaring(sheet, 'transition-property')).toEqual(['.stage']);
    expect(new Set(selectorsDeclaring(sheet, 'transition'))).toEqual(
      new Set(['.stage', '.stage[data-instant]']),
    );
    expect(selectorsDeclaring(sheet, 'animation')).toEqual([]);
  });

  /* Mesuré au navigateur : 1,84:1 et 2,26:1 pour les boutons sur `blue`,
     2,97:1 pour le secondaire sur `amber`. Le contrat des fonds en calcule
     les couples ; ici, la feuille pose les surcharges dans la section. */
  it('inverse le bouton principal et pâlit le secondaire sur `blue`', () => {
    const rule = declarations(sheet, ".section[data-ground='blue']");
    expect(rule.get('--opale-primary')).toBe('var(--opale-ground-blue-ink)');
    expect(rule.get('--opale-primary-dark')).toBe('var(--opale-ground-blue-hover)');
    expect(rule.get('--opale-on-primary')).toBe('var(--opale-ground-blue)');
    expect(rule.get('--opale-secondary-dark')).toBe('var(--opale-ground-blue-secondary)');
  });

  it('fonce le bouton secondaire sur `amber`', () => {
    const rule = declarations(sheet, ".section[data-ground='amber']");
    expect(rule.get('--opale-secondary-dark')).toBe('var(--opale-ground-amber-secondary)');
  });

  it('déclare les teintes des boutons sur `:root`', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-ground-blue-hover')).toBe('#dce6f5');
    expect(root.get('--opale-ground-blue-secondary')).toBe('#b4cff5');
    expect(root.get('--opale-ground-amber-secondary')).toBe('#335f7b');
  });

  /* Le serveur, l'hydratation et la première mesure posent `data-instant` :
     la scène prend son fond d'un coup, le fondu ne sert qu'au défilement. */
  it('ne fond rien tant que la scène porte `data-instant`', () => {
    expect(declaration(sheet, '.stage[data-instant]', 'transition')).toBe('none');
  });

  it('contient les marges de ses enfants : le fond de la section les couvre', () => {
    expect(declaration(sheet, '.section', 'display')).toBe('flow-root');
  });

  it.each(['@media (prefers-reduced-motion: reduce)', '@media print'])(
    'ne fond rien sous %s',
    (within) => {
      expect(declaration(sheet, '.stage', 'transition', { within })).toBe('none');
    },
  );
});
