import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Marquee, type MarqueeProps } from './Marquee';
import { atRules, declaration, declarations, selectorsDeclaring } from '../../../test/css-rules';
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

const ITEMS = ['WCAG 2.2 AA', 'React 19', 'Aucune dépendance'];

const renderMarquee = (props: Partial<MarqueeProps> = {}) =>
  render(
    <Marquee label="Ce qu’Opale garantit" {...props}>
      <span>WCAG 2.2 AA</span>
      <span>React 19</span>
      <span>Aucune dépendance</span>
    </Marquee>,
  );

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
    const button = screen.getByRole('button', { name: 'Mettre en pause' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toBeVisible();
    expect(button).toHaveClass('opale-marquee__toggle');
    const [first] = readable('WCAG 2.2 AA');
    expect(button.compareDocumentPosition(first!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('change de nom, sans `aria-pressed`, et suspend le défilement', () => {
    renderMarquee();
    const button = screen.getByRole('button', { name: 'Mettre en pause' });
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(region()).not.toHaveAttribute('data-paused');
    fireEvent.click(button);
    expect(button).toHaveAccessibleName('Lire');
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(region()).toHaveAttribute('data-paused');
    fireEvent.click(button);
    expect(button).toHaveAccessibleName('Mettre en pause');
    expect(region()).not.toHaveAttribute('data-paused');
  });

  it('prend ses textes dans `labels`, clé par clé', () => {
    renderMarquee({ labels: { pause: 'Pause', play: undefined } });
    const button = screen.getByRole('button', { name: 'Pause' });
    fireEvent.click(button);
    expect(button).toHaveAccessibleName('Lire');
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

describe('Marquee — mouvement réduit', () => {
  it('ne rend ni la copie ni le bouton, et laisse le contenu immobile', () => {
    reducedMotion = true;
    renderMarquee();
    expect(clones()).toHaveLength(0);
    expect(region()).not.toHaveAttribute('data-animated');
    expect(screen.getByRole('button', { hidden: true })).not.toBeVisible();
    for (const text of ITEMS) expect(readable(text)).toHaveLength(1);
  });

  it('n’anime qu’en écran et sans préférence de mouvement réduit', () => {
    const animated = '@media screen and (prefers-reduced-motion: no-preference)';
    expect(selectorsDeclaring(sheet, 'animation')).toEqual(['.root[data-animated] .track']);
    expect(
      declaration(sheet, '.root[data-animated] .track', 'animation', { within: animated }),
    ).toBe('slide var(--opale-marquee-duration) linear infinite');
    /* Au repos — serveur, sans script, mouvement réduit, impression — la
       copie est absente et le contenu passe à la ligne, jamais rogné. */
    expect(declaration(sheet, '.clone', 'display')).toBe('none');
    expect(declaration(sheet, '.copy', 'flex-wrap')).toBe('wrap');
    expect(declaration(sheet, '.viewport', 'overflow')).toBeUndefined();
    expect(declaration(sheet, '.toggle[hidden]', 'display')).toBe('none');
    expect(
      declaration(sheet, '.toggle', 'display', {
        within: '@media (prefers-reduced-motion: reduce), print',
      }),
    ).toBe('none');
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
  const animated = '@media screen and (prefers-reduced-motion: no-preference)';
  const at = (selector: string) => declarations(sheet, selector, { within: animated });

  it('boucle sans couture : deux copies identiques, chacune au moins aussi large que la vue', () => {
    expect(at('.root[data-animated] .viewport').get('overflow')).toBe('hidden');
    expect(declaration(sheet, '.viewport', 'container-type')).toBe('inline-size');
    expect(at('.root[data-animated] .track').get('inline-size')).toBe('max-content');
    const copy = at('.root[data-animated] .copy');
    expect(copy.get('flex-wrap')).toBe('nowrap');
    expect(copy.get('min-inline-size')).toBe('100cqi');
    /* L'espace qui suit la dernière entrée est celui qui sépare deux entrées :
       la jointure ne se voit pas, et -50 % vaut exactement une copie. */
    expect(copy.get('padding-inline-end')).toBe('var(--opale-marquee-gap, var(--opale-space-xl))');
    expect(declaration(sheet, '.copy', 'gap')).toBe(
      'var(--opale-marquee-gap, var(--opale-space-xl))',
    );
    expect(at('.root[data-animated] .clone').get('display')).toBe('flex');
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

  it('estompe les bords par un masque, seulement en mouvement', () => {
    expect(at('.root[data-animated][data-fade] .viewport').get('mask')).toMatch(
      /^linear-gradient\(/,
    );
    expect(selectorsDeclaring(sheet, 'mask')).toEqual([
      '.root[data-animated][data-fade] .viewport',
    ]);
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
    expect(html).toMatch(/<button[^>]*hidden/);
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
    expect(button).toBeVisible();
    act(() => button?.click());
    expect(button).toHaveAccessibleName('Lire');
    expect(marquee).toHaveAttribute('data-paused');
    await act(async () => root?.unmount());
    host.remove();
  });
});
