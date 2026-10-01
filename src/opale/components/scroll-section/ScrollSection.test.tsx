import { act, render, screen } from '@testing-library/react';
import { createRef, StrictMode, type ReactNode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollSection, ScrollStage, type ScrollGround, type ScrollStageProps } from '.';
import { declaration, declarations, selectorsDeclaring } from '../../../test/css-rules';
import sheet from './style/ScrollSection.module.css?raw';
import opaleSource from '../../opale.css?raw';

/* =============================================================================
   LA SCÈNE ET SES SECTIONS, MESURÉES CONTRE LEURS CRITÈRES.

   jsdom n'a ni mise en page ni défilement : `IntersectionObserver` est une
   fausse qu'on déclenche à la main, une entrée à la fois ou plusieurs d'un
   coup (un saut). La feuille se lit par son arbre : c'est elle qui peint les
   fonds et qui fond la scène.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Un `IntersectionObserver` qu'on déclenche à la main. */
class FakeIntersectionObserver {
  static readonly all: FakeIntersectionObserver[] = [];
  readonly targets = new Set<Element>();
  readonly options: IntersectionObserverInit | undefined;
  disconnected = false;
  private readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    FakeIntersectionObserver.all.push(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
    this.disconnected = true;
  }
  takeRecords() {
    return [];
  }
  /* Un lot d'entrées : chaque paire dit si la cible croise le milieu de la vue. */
  fire(...pairs: ReadonlyArray<readonly [Element, boolean]>) {
    const entries = pairs.map(
      ([target, isIntersecting]) => ({ target, isIntersecting }) as IntersectionObserverEntry,
    );
    act(() => this.callback(entries, this as unknown as IntersectionObserver));
  }
}

/* Les observateurs encore branchés : un seul par scène, jamais de fuite. */
const live = () => FakeIntersectionObserver.all.filter((one) => !one.disconnected);

beforeEach(() => {
  FakeIntersectionObserver.all.length = 0;
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const stage = () => screen.getByTestId('stage');
const section = (ground: ScrollGround) => screen.getByTestId(ground);

const FOUR: readonly ScrollGround[] = ['paper', 'amber', 'night', 'blue'];

const renderStage = (props: Partial<ScrollStageProps> = {}, grounds = FOUR) =>
  render(
    <ScrollStage data-testid="stage" {...props}>
      {grounds.map((ground) => (
        <ScrollSection key={ground} ground={ground} data-testid={ground}>
          <p>{ground}</p>
        </ScrollSection>
      ))}
    </ScrollStage>,
  );

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

  it('peint son fond hors de toute scène, sans observateur ni avertissement', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ScrollSection ground="night" data-testid="night" />);
    expect(section('night')).toHaveAttribute('data-ground', 'night');
    expect(FakeIntersectionObserver.all).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
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

  it('prend au rendu le fond de la première section', () => {
    renderStage({}, ['night', 'paper']);
    expect(stage()).toHaveAttribute('data-ground', 'night');
  });

  it('saute un premier enfant sans fond, et retombe sur `paper` sans section', () => {
    render(
      <ScrollStage data-testid="stage">
        <p>Intro</p>
        <ScrollSection ground="blue">Bleu</ScrollSection>
      </ScrollStage>,
    );
    expect(stage()).toHaveAttribute('data-ground', 'blue');
    act(() => undefined);
    render(<ScrollStage data-testid="vide">Rien</ScrollStage>);
    expect(screen.getByTestId('vide')).toHaveAttribute('data-ground', 'paper');
  });
});

describe('ScrollStage — la section active', () => {
  it('observe toutes ses sections avec un seul observateur, sur la ligne du milieu', () => {
    renderStage();
    expect(FakeIntersectionObserver.all).toHaveLength(1);
    const [watcher] = FakeIntersectionObserver.all;
    expect(watcher.options?.rootMargin).toBe('-50% 0px -50% 0px');
    for (const ground of FOUR) expect(watcher.targets.has(section(ground))).toBe(true);
  });

  it('suit la section qui croise le milieu de la vue', () => {
    renderStage();
    const [watcher] = FakeIntersectionObserver.all;
    watcher.fire([section('amber'), true]);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
    watcher.fire([section('amber'), false], [section('night'), true]);
    expect(stage()).toHaveAttribute('data-ground', 'night');
  });

  it('garde le dernier fond quand plus aucune section ne croise le milieu', () => {
    renderStage();
    const [watcher] = FakeIntersectionObserver.all;
    watcher.fire([section('blue'), true]);
    watcher.fire([section('blue'), false]);
    expect(stage()).toHaveAttribute('data-ground', 'blue');
  });

  /* La touche Fin saute toutes les sections du milieu : seule la dernière
     croise la ligne, et c'est sur elle que la scène finit. */
  it('finit un saut sur la section d’arrivée', () => {
    renderStage();
    const [watcher] = FakeIntersectionObserver.all;
    watcher.fire([section('paper'), true]);
    watcher.fire([section('paper'), false], [section('blue'), true]);
    expect(stage()).toHaveAttribute('data-ground', 'blue');
  });

  it('prévient `onGroundChange` au changement seulement', () => {
    const onGroundChange = vi.fn();
    renderStage({ onGroundChange });
    const [watcher] = FakeIntersectionObserver.all;
    /* La première section au milieu : la scène l'affichait déjà. */
    watcher.fire([section('paper'), true]);
    expect(onGroundChange).not.toHaveBeenCalled();
    watcher.fire([section('paper'), false], [section('amber'), true]);
    watcher.fire([section('amber'), true]);
    expect(onGroundChange).toHaveBeenCalledTimes(1);
    expect(onGroundChange).toHaveBeenLastCalledWith('amber');
    watcher.fire([section('amber'), false], [section('night'), true]);
    expect(onGroundChange).toHaveBeenCalledTimes(2);
    expect(onGroundChange).toHaveBeenLastCalledWith('night');
  });

  it('rappelle le `onGroundChange` le plus récent, sans recréer l’observateur', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderStage({ onGroundChange: first });
    rerender(
      <ScrollStage data-testid="stage" onGroundChange={second}>
        {FOUR.map((ground) => (
          <ScrollSection key={ground} ground={ground} data-testid={ground} />
        ))}
      </ScrollStage>,
    );
    expect(FakeIntersectionObserver.all).toHaveLength(1);
    FakeIntersectionObserver.all[0].fire([section('night'), true]);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('night');
  });

  it('suit le nouveau fond d’une section active', () => {
    const Scene = ({ ground }: { ground: ScrollGround }) => (
      <ScrollStage data-testid="stage">
        <ScrollSection ground="paper" />
        <ScrollSection ground={ground} data-testid="active" />
      </ScrollStage>
    );
    const { rerender } = render(<Scene ground="amber" />);
    const [watcher] = FakeIntersectionObserver.all;
    watcher.fire([screen.getByTestId('active'), true]);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
    rerender(<Scene ground="night" />);
    /* Réobservée, la section est signalée de nouveau, avec son fond neuf. */
    expect(watcher.targets.has(screen.getByTestId('active'))).toBe(true);
    watcher.fire([screen.getByTestId('active'), true]);
    expect(stage()).toHaveAttribute('data-ground', 'night');
  });

  it('cesse d’observer une section retirée, et déconnecte tout au démontage', () => {
    const Scene = ({ children }: { children?: ReactNode }) => (
      <ScrollStage data-testid="stage">
        <ScrollSection ground="paper" data-testid="paper" />
        {children}
      </ScrollStage>
    );
    const { rerender, unmount } = render(
      <Scene>
        <ScrollSection ground="blue" data-testid="blue" />
      </Scene>,
    );
    const [watcher] = FakeIntersectionObserver.all;
    const blue = section('blue');
    rerender(<Scene />);
    expect(watcher.targets.has(blue)).toBe(false);
    expect(watcher.targets.size).toBe(1);
    unmount();
    expect(watcher.disconnected).toBe(true);
    expect(live()).toHaveLength(0);
  });

  it('tient sous StrictMode : un seul observateur branché, qui suit tout', () => {
    const onGroundChange = vi.fn();
    const { unmount } = render(
      <StrictMode>
        <ScrollStage data-testid="stage" onGroundChange={onGroundChange}>
          {FOUR.map((ground) => (
            <ScrollSection key={ground} ground={ground} data-testid={ground} />
          ))}
        </ScrollStage>
      </StrictMode>,
    );
    expect(live()).toHaveLength(1);
    const [watcher] = live();
    for (const ground of FOUR) expect(watcher.targets.has(section(ground))).toBe(true);
    watcher.fire([section('night'), true]);
    expect(stage()).toHaveAttribute('data-ground', 'night');
    expect(onGroundChange).toHaveBeenCalledTimes(1);
    unmount();
    expect(live()).toHaveLength(0);
  });

  it('reste sur le premier fond sans `IntersectionObserver`', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    renderStage({}, ['amber', 'night']);
    expect(stage()).toHaveAttribute('data-ground', 'amber');
  });
});

describe('ScrollStage — rendu serveur', () => {
  const fixture = () => (
    <ScrollStage as="main">
      <ScrollSection ground="amber">
        <h2>Ambre</h2>
      </ScrollSection>
      <ScrollSection ground="night">
        <h2>Nuit</h2>
      </ScrollSection>
    </ScrollStage>
  );

  const renderOnServer = () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      return renderToString(fixture());
    } finally {
      vi.unstubAllGlobals();
      vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    }
  };

  it('écrit déjà le fond de la première section, et chaque section son couple', () => {
    const html = renderOnServer();
    expect(html).toMatch(/^<main[^>]*data-ground="amber"/);
    expect(html).toMatch(/<section[^>]*data-ground="amber"[^>]*data-opale-page-theme="light"/);
    expect(html).toMatch(/<section[^>]*data-ground="night"[^>]*data-opale-page-theme="dark"/);
    expect(html).not.toMatch(/style=/);
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
    expect(host.querySelector('main')).toHaveAttribute('data-ground', 'amber');
    expect(live()).toHaveLength(1);
    await act(async () => root?.unmount());
    expect(live()).toHaveLength(0);
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
    expect(new Set(selectorsDeclaring(sheet, 'transition'))).toEqual(new Set(['.stage']));
    expect(selectorsDeclaring(sheet, 'animation')).toEqual([]);
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
