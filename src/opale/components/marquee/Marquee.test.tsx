import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode, type CSSProperties } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Marquee, type MarqueeProps } from './Marquee';
import { resetWarnings } from '../../shared/dev-warning';
import { expectConsole } from '../../../test/console-guard';
import {
  atRules,
  declaration,
  declarations,
  parseRules,
  selectorsDeclaring,
} from '../../../test/css-rules';
import sheet from './style/Marquee.module.css?raw';
import opaleSource from '../../opale.css?raw';

/* =============================================================================
   LE BANDEAU DÉFILANT, MESURÉ CONTRE SES CRITÈRES.

   jsdom n'a ni mise en page ni animation : la préférence de mouvement est une
   fausse `matchMedia`, la direction vient du style en ligne, et le défilement
   lui-même — c'est la feuille qui le porte — se lit par son arbre. Le vrai
   mouvement se vérifie dans Chromium.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reducedMotion = false;

beforeEach(() => {
  reducedMotion = false;
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
});

/* Le bloc de la bande : écran, script, mouvement permis. */
const BAND = '@media screen and (scripting: enabled) and (prefers-reduced-motion: no-preference)';

const ITEMS = ['WCAG 2.2 AA', 'React 19', 'Aucune dépendance'];

const renderMarquee = (props: Partial<MarqueeProps> = {}) =>
  render(
    <Marquee label="Ce qu’Opale garantit" {...props}>
      <span>WCAG 2.2 AA</span>
      <span>React 19</span>
      <span>Aucune dépendance</span>
    </Marquee>,
  );

/* Le bouton par son texte : jsdom n'évalue pas `@media`, et le laisse sous
   la règle de repos (`display: none`), hors de l'arbre d'accessibilité. Sa
   présence dans la bande se lit dans la feuille ; son nom, dans Chromium. */
const toggle = (text: string) => {
  const button = document.querySelector<HTMLButtonElement>('.opale-marquee__toggle');
  expect(button).toHaveTextContent(text);
  return button!;
};
const region = () => screen.getByRole('region', { name: 'Ce qu’Opale garantit' });
const clones = (root: ParentNode = document) => root.querySelectorAll('[aria-hidden="true"]');
/* Ce qu'une technique d'assistance lit : les nœuds hors de tout `aria-hidden`. */
const readable = (text: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll('span')).filter(
    (node) => node.textContent === text && !node.closest('[aria-hidden="true"]'),
  );

describe('Marquee — sémantique', () => {
  it('est une région nommée par `label`, sans description de rôle', () => {
    renderMarquee();
    expect(region()).toHaveClass('opale-marquee');
    expect(region()).not.toHaveAttribute('aria-roledescription');
  });

  it('rend chaque élément une seule fois pour les techniques d’assistance', () => {
    renderMarquee();
    for (const text of ITEMS) expect(readable(text)).toHaveLength(1);
  });

  it('cache la copie de la boucle : `aria-hidden` et `inert`, sans rien de focalisable', () => {
    /* Des liens dans la boucle : le composant prévient que leur copie est inerte. */
    expectConsole('warn', /Marquee : une entrée interactive est inerte dans la copie/);
    render(
      <Marquee label="Liens">
        <a href="#a">Premier</a>
        <a href="#b">Second</a>
      </Marquee>,
    );
    const [clone, ...others] = Array.from(clones());
    expect(others).toHaveLength(0);
    expect(clone).toHaveAttribute('inert');
    expect(clone).toHaveTextContent('PremierSecond');
    expect(screen.getAllByRole('link')).toHaveLength(2);
    const copied = clone?.querySelector('a');
    copied?.focus();
    expect(document.activeElement).not.toBe(copied);
  });

  it('lit les enfants tels qu’écrits : un fragment et un texte nu défilent aussi', () => {
    render(
      <Marquee label="Fragments">
        <>
          <span>Un</span>
          <span>Deux</span>
        </>
        Trois
      </Marquee>,
    );
    expect(readable('Un')).toHaveLength(1);
    expect(clones()[0]).toHaveTextContent('UnDeuxTrois');
  });
});

describe('Marquee — pause (WCAG 2.2.2)', () => {
  it('rend toujours un bouton pause, avant le contenu qui défile', () => {
    renderMarquee();
    const button = toggle('Mettre en pause');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('hidden');
    expect(button).toHaveClass('opale-marquee__toggle');
    const [first] = readable('WCAG 2.2 AA');
    expect(button.compareDocumentPosition(first!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('change de nom, sans `aria-pressed`, et suspend le défilement', () => {
    renderMarquee();
    const button = toggle('Mettre en pause');
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(region()).not.toHaveAttribute('data-paused');
    fireEvent.click(button);
    expect(button).toHaveTextContent('Lire');
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(region()).toHaveAttribute('data-paused');
    fireEvent.click(button);
    expect(button).toHaveTextContent('Mettre en pause');
    expect(region()).not.toHaveAttribute('data-paused');
  });

  it('prend ses textes dans `labels`, clé par clé', () => {
    renderMarquee({ labels: { pause: 'Pause', play: undefined } });
    const button = toggle('Pause');
    fireEvent.click(button);
    expect(button).toHaveTextContent('Lire');
  });

  it('suspend la piste au bouton, sous le pointeur et tant que le focus est dans le contenu', () => {
    expect(declaration(sheet, '.root[data-paused] .track', 'animation-play-state')).toBe('paused');
    expect(declaration(sheet, '.viewport:focus-within .track', 'animation-play-state')).toBe(
      'paused',
    );
    expect(
      declaration(sheet, '.viewport:hover .track', 'animation-play-state', {
        within: '@media (hover: hover)',
      }),
    ).toBe('paused');
    /* Ni le survol ni le focus du BOUTON ne suspendent : « Lire » cliqué
       reprend aussitôt, le pointeur et le focus encore dessus. */
    expect(selectorsDeclaring(sheet, 'animation-play-state')).toEqual([
      '.root[data-paused] .track',
      '.viewport:focus-within .track',
      '.viewport:hover .track',
    ]);
  });
});

describe('Marquee — focus', () => {
  /* Revue : Chromium fait défiler la vue `overflow: hidden` pour montrer une
     entrée focalisée ; le décalage restait après la sortie du focus et
     ouvrait un trou à chaque fin de boucle. */
  it('remet la vue à son origine quand le focus la quitte', () => {
    render(
      <>
        <Marquee label="Focus">
          <a href="#un">Un</a>
          <a href="#deux">Deux</a>
        </Marquee>
        <button type="button">Après</button>
      </>,
    );
    const viewport = document.querySelector<HTMLElement>('.opale-marquee__viewport')!;
    const [one, two] = screen.getAllByRole('link');
    one!.focus();
    viewport.scrollLeft = 400;
    fireEvent.focusOut(one!, { relatedTarget: two });
    expect(viewport.scrollLeft).toBe(400);
    fireEvent.focusOut(two!, { relatedTarget: screen.getByRole('button', { name: 'Après' }) });
    expect(viewport.scrollLeft).toBe(0);
  });
});

describe('Marquee — mouvement réduit', () => {
  it('ne rend pas la copie et laisse le contenu immobile', () => {
    reducedMotion = true;
    renderMarquee();
    expect(clones()).toHaveLength(0);
    expect(region()).not.toHaveAttribute('data-animated');
    for (const text of ITEMS) expect(readable(text)).toHaveLength(1);
  });

  /* Revue : la bande ne doit pas sauter à l'hydratation (CLS 0). Sa mise en
     page dépend du média — écran, script, mouvement permis —, pas de
     `data-animated` ; seuls l'animation et la copie attendent le script. */
  it('pose la bande par le média, et non à l’hydratation', () => {
    const band = (selector: string) => declarations(sheet, selector, { within: BAND });
    expect(band('.viewport').get('overflow')).toBe('hidden');
    expect(band('.viewport').get('container-type')).toBe('inline-size');
    expect(band('.track').get('inline-size')).toBe('max-content');
    expect(band('.copy').get('flex-wrap')).toBe('nowrap');
    expect(band('.toggle').get('display')).toBe('inline-grid');
    /* Avant l'hydratation, le bouton garde sa boîte, mais n'est ni montré, ni
       focalisable, ni exposé. */
    expect(band('.root:not([data-animated]) .toggle').get('visibility')).toBe('hidden');
    expect(band('.root[data-animated] .track').get('animation')).toBe(
      'slide var(--opale-marquee-duration) linear infinite',
    );
    expect(band('.root[data-animated] .clone').get('display')).toBe('flex');
    const keyed = parseRules(sheet)
      .flatMap((rule) => rule.selectors)
      .filter((selector) => selector.includes('data-animated'));
    expect(keyed).toEqual([
      '.root:not([data-animated]) .toggle',
      '.root[data-animated] .track',
      '.root[data-animated] .clone',
      '.root[data-animated]:not([data-paused]) .track',
    ]);
    expect(selectorsDeclaring(sheet, 'animation')).toEqual(['.root[data-animated] .track']);
  });

  /* Sans script (`scripting: none`), sous mouvement réduit et à l'impression,
     aucune règle de la bande ne s'applique : le contenu passe à la ligne, le
     bouton n'existe pas. */
  it('reste immobile et à la ligne hors de la bande, sans bouton', () => {
    expect(atRules(sheet, 'media')).toContain(
      'screen and (scripting: enabled) and (prefers-reduced-motion: no-preference)',
    );
    expect(declaration(sheet, '.clone', 'display')).toBe('none');
    expect(declaration(sheet, '.copy', 'flex-wrap')).toBe('wrap');
    expect(declaration(sheet, '.viewport', 'overflow')).toBeUndefined();
    expect(declaration(sheet, '.viewport', 'container-type')).toBeUndefined();
    expect(declaration(sheet, '.toggle', 'display')).toBe('none');
    expect(selectorsDeclaring(sheet, 'overflow')).toEqual(['.viewport']);
    expect(selectorsDeclaring(sheet, 'container-type')).toEqual(['.viewport']);
  });

  /* Revue : `container-type` effondre la bande à 0 dans un contexte qui se
     dimensionne au contenu (flex, `fit-content`, cellule) ; la racine prend
     toute la ligne. */
  it('prend toute la ligne, même dans un contexte dimensionné au contenu', () => {
    expect(declaration(sheet, '.root', 'inline-size')).toBe('100%');
    expect(declaration(sheet, '.root', 'min-inline-size')).toBe('0');
  });
});

describe('Marquee — direction', () => {
  it('suit la direction calculée de son contexte, de droite à gauche comprise', () => {
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Marquee label="RTL">
          <span>واحد</span>
        </Marquee>
      </div>,
    );
    expect(screen.getByRole('region', { name: 'RTL' })).toHaveAttribute('data-dir', 'rtl');
  });

  it('ne pose rien de gauche à droite', () => {
    renderMarquee();
    expect(region()).not.toHaveAttribute('data-dir');
  });

  it('translate d’une copie exactement, vers la fin de la lecture, et à rebours sous `reverse`', () => {
    const slide = sheet.match(/@keyframes slide\s*\{([\s\S]*?\})\s*\}/)?.[1] ?? '';
    expect(slide).toMatch(/transform:\s*translateX\(var\(--opale-marquee-shift\)\)/);
    expect(declaration(sheet, '.root', '--opale-marquee-shift')).toBe('-50%');
    expect(declaration(sheet, ".root[data-dir='rtl']", '--opale-marquee-shift')).toBe('50%');
    expect(declaration(sheet, '.root[data-reverse] .track', 'animation-direction')).toBe('reverse');
  });

  it('marque `reverse` sur la racine', () => {
    renderMarquee({ reverse: true });
    expect(region()).toHaveAttribute('data-reverse');
  });
});

describe('Marquee — réglages', () => {
  it('pose la durée d’une boucle, en secondes, sur la racine', () => {
    renderMarquee({ duration: 12 });
    expect(region().style.getPropertyValue('--opale-marquee-duration')).toBe('12s');
  });

  it('laisse le jeton de 28 s quand la durée est absente ou invalide', () => {
    expect(declarations(opaleSource, ':root').get('--opale-marquee-duration')).toBe('28s');
    const { unmount } = renderMarquee();
    expect(region().style.getPropertyValue('--opale-marquee-duration')).toBe('');
    unmount();
    renderMarquee({ duration: 0 });
    expect(region().style.getPropertyValue('--opale-marquee-duration')).toBe('');
  });

  it('prend l’espace sur l’échelle `--opale-space-*`', () => {
    const { unmount } = renderMarquee({ gap: 'lg' });
    expect(region().style.getPropertyValue('--opale-marquee-gap')).toBe('var(--opale-space-lg)');
    unmount();
    renderMarquee({ gap: 'none' });
    expect(region().style.getPropertyValue('--opale-marquee-gap')).toBe('0px');
  });

  it('estompe les bords par défaut, et plus sous `fade={false}`', () => {
    const { unmount } = renderMarquee();
    expect(region()).toHaveAttribute('data-fade');
    unmount();
    renderMarquee({ fade: false });
    expect(region()).not.toHaveAttribute('data-fade');
  });

  it('transmet `ref`, `className`, `style` et le reste à la racine', () => {
    const ref = createRef<HTMLDivElement>();
    renderMarquee({
      ref,
      className: 'maison',
      style: { color: 'red' },
      id: 'bandeau',
      duration: 9,
    });
    expect(ref.current).toBe(region());
    expect(region()).toHaveClass('opale-marquee', 'maison');
    expect(region()).toHaveAttribute('id', 'bandeau');
    expect(region().style.color).toBe('red');
    expect(region().style.getPropertyValue('--opale-marquee-duration')).toBe('9s');
  });

  it('expose ses parties par des classes stables', () => {
    renderMarquee();
    for (const name of ['viewport', 'track', 'copy']) {
      expect(region().querySelector(`.opale-marquee__${name}`)).not.toBeNull();
    }
    expect(region().querySelectorAll('.opale-marquee__copy')).toHaveLength(2);
  });
});

describe('Marquee — feuille', () => {
  const at = (selector: string) => declarations(sheet, selector, { within: BAND });

  it('boucle sans couture : deux copies identiques, chacune au moins aussi large que la vue', () => {
    const copy = at('.copy');
    expect(copy.get('min-inline-size')).toBe('100cqi');
    /* L'espace qui suit la dernière entrée est celui qui sépare deux entrées :
       la jointure ne se voit pas, et -50 % vaut exactement une copie. */
    expect(copy.get('padding-inline-end')).toBe('var(--opale-marquee-gap, var(--opale-space-xl))');
    expect(declaration(sheet, '.copy', 'gap')).toBe(
      'var(--opale-marquee-gap, var(--opale-space-xl))',
    );
  });

  it('n’anime que `transform`, et ne prévient le compositeur qu’en marche', () => {
    const slide = sheet.match(/@keyframes slide\s*\{([\s\S]*?\})\s*\}/)?.[1] ?? '';
    const animatedProps = [...slide.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1]);
    expect(new Set(animatedProps)).toEqual(new Set(['transform']));
    expect(selectorsDeclaring(sheet, 'will-change')).toEqual([
      '.root[data-animated]:not([data-paused]) .track',
    ]);
    expect(atRules(sheet, 'keyframes')).toEqual(['slide']);
  });

  it('estompe les bords par un masque horizontal, seulement dans la bande', () => {
    expect(at('.root[data-fade] .viewport').get('mask')).toMatch(/^linear-gradient\(to right,/);
    expect(selectorsDeclaring(sheet, 'mask')).toEqual(['.root[data-fade] .viewport']);
  });

  /* Revue : la vue a exactement la hauteur de la piste, et `overflow` rognait
     en haut et en bas l'anneau de focus d'une entrée focalisable. */
  it('laisse la place de l’anneau de focus au-dessus et au-dessous de la piste', () => {
    expect(at('.viewport').get('padding-block')).toBe(
      'calc(var(--opale-focus-ring-width) + var(--opale-focus-ring-offset))',
    );
  });

  it('garde le bouton visible en couleurs forcées', () => {
    const forced = declarations(sheet, '.toggle', { within: '@media (forced-colors: active)' });
    expect(forced.get('border-color')).toBe('ButtonText');
    expect(forced.get('color')).toBe('ButtonText');
    expect(declaration(sheet, '.toggle:focus-visible', 'outline')).toBe(
      'var(--opale-focus-ring-width) solid var(--opale-focus)',
    );
  });
});

describe('Marquee — rendu serveur', () => {
  const fixture = () => (
    <Marquee label="Garanties">
      <span>WCAG 2.2 AA</span>
      <span>React 19</span>
    </Marquee>
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

  it('rend le contenu une fois, lisible et immobile', () => {
    const html = renderOnServer();
    expect(html.match(/React 19/g)).toHaveLength(1);
    expect(html).not.toContain('aria-hidden');
    expect(html).not.toContain('data-animated');
    /* Le bouton garde sa boîte : c'est la feuille qui le cache avant
       l'hydratation, sans décaler la page ensuite. */
    expect(html).toMatch(/<button type="button" class="opale-marquee__toggle/);
    expect(html).not.toMatch(/<button[^>]*hidden/);
    expect(html).toMatch(/^<div role="region" aria-label="Garanties"/);
  });

  it('s’hydrate sans écart sous StrictMode, puis défile et se met en pause', async () => {
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
    const marquee = host.querySelector('[role="region"]');
    expect(marquee).toHaveAttribute('data-animated');
    expect(clones(host)).toHaveLength(1);
    expect(readable('React 19', host)).toHaveLength(1);
    const button = host.querySelector('button');
    expect(button).not.toHaveAttribute('hidden');
    act(() => button?.click());
    expect(button).toHaveTextContent('Lire');
    expect(marquee).toHaveAttribute('data-paused');
    await act(async () => root?.unmount());
    host.remove();
  });
});

describe('Marquee — revue', () => {
  beforeEach(() => resetWarnings());

  /* Revue : la direction n'était lue qu'au montage ; un `dir` changé ensuite
     laissait la bande glisser du mauvais côté, vide la plupart de la boucle. */
  it('relit la direction à chaque rendu', () => {
    const tree = (direction: 'ltr' | 'rtl') => (
      <div style={{ direction }}>
        <Marquee label="Langue">
          <span>Un</span>
        </Marquee>
      </div>
    );
    const { rerender } = render(tree('ltr'));
    const band = screen.getByRole('region', { name: 'Langue' });
    expect(band).not.toHaveAttribute('data-dir');
    rerender(tree('rtl'));
    expect(band).toHaveAttribute('data-dir', 'rtl');
    rerender(tree('ltr'));
    expect(band).not.toHaveAttribute('data-dir');
  });

  it('relit la direction à chaque tour de boucle, sans rendu du parent', () => {
    render(
      <div data-testid="parent">
        <Marquee label="Langue">
          <span>Un</span>
        </Marquee>
      </div>,
    );
    const band = screen.getByRole('region', { name: 'Langue' });
    /* Un effet du parent, après celui de l'enfant, pose `dir`. */
    screen.getByTestId('parent').style.direction = 'rtl';
    /* jsdom n'a pas d'`AnimationEvent` : React y écoute le nom préfixé. */
    fireEvent(
      band.querySelector('.opale-marquee__track')!,
      new Event('webkitAnimationIteration', { bubbles: true }),
    );
    expect(band).toHaveAttribute('data-dir', 'rtl');
  });

  it('rejette une durée négative ou non finie', () => {
    for (const duration of [-3, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { unmount } = renderMarquee({ duration });
      expect(region().style.getPropertyValue('--opale-marquee-duration')).toBe('');
      unmount();
    }
  });

  /* Revue : `undefined` écrit après `...style` effaçait les propriétés que
     l'appelant passait lui-même. */
  it('garde les propriétés personnalisées de `style` quand la prop est absente', () => {
    const style = {
      '--opale-marquee-duration': '10s',
      '--opale-marquee-gap': '4px',
    } as CSSProperties;
    const { unmount } = renderMarquee({ style });
    expect(region().style.getPropertyValue('--opale-marquee-duration')).toBe('10s');
    expect(region().style.getPropertyValue('--opale-marquee-gap')).toBe('4px');
    unmount();
    renderMarquee({ style, duration: 0 });
    expect(region().style.getPropertyValue('--opale-marquee-duration')).toBe('10s');
  });

  /* DÉCIDÉ : les entrées ne sont pas interactives (la copie inerte rendrait
     un clic sur deux sans effet). Un avertissement de développement le dit. */
  it('avertit une fois, en développement, d’une entrée interactive', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderMarquee();
    expect(warn).not.toHaveBeenCalled();
    for (const entry of [
      <a href="#a">Lien</a>,
      <input aria-label="Champ" />,
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- précisément le mauvais usage que l'avertissement doit signaler.
      <span tabIndex={0}>Focalisable</span>,
    ]) {
      resetWarnings();
      warn.mockClear();
      const { unmount } = render(<Marquee label="Interactif">{entry}</Marquee>);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toMatch(/\[Opale\] Marquee/);
      unmount();
    }
    warn.mockClear();
    resetWarnings();
    render(
      <Marquee label="Inerte">
        <span tabIndex={-1}>Hors tabulation</span>
      </Marquee>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('Marquee — hydratation de droite à gauche', () => {
  it('s’hydrate sans écart dans un contexte `dir="rtl"`, puis pose `data-dir`', async () => {
    const fixture = (
      <Marquee label="RTL">
        <span>واحد</span>
      </Marquee>
    );
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    let html = '';
    try {
      html = renderToString(fixture);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(html).not.toContain('data-dir');
    const host = document.createElement('div');
    host.dir = 'rtl';
    host.style.direction = 'rtl';
    host.innerHTML = html;
    document.body.append(host);
    const errors: string[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, <StrictMode>{fixture}</StrictMode>, {
          onRecoverableError: (error) => errors.push(String(error)),
        });
      });
    } finally {
      consoleError.mockRestore();
    }
    expect(errors).toEqual([]);
    expect(host.querySelector('[role="region"]')).toHaveAttribute('data-dir', 'rtl');
    await act(async () => root?.unmount());
    host.remove();
  });
});
