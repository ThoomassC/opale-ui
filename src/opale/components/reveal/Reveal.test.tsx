import { act, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Reveal, type RevealProps } from './Reveal';
import { declaration, declarations, selectorsDeclaring } from '../../../test/css-rules';
import { isBelowFold } from './reveal-fold';
import sheet from './style/Reveal.module.css?raw';
import opaleSource from '../../opale.css?raw';

/* =============================================================================
   L'APPARITION AU DÉFILEMENT, MESURÉE CONTRE SES CRITÈRES.

   jsdom n'a ni mise en page ni chronologie de défilement : `CSS.supports` dit
   ce qu'on lui fait dire, `IntersectionObserver` est une fausse qu'on
   déclenche à la main, `getBoundingClientRect` rend la position qu'on choisit,
   et la décision « sous la ligne de flottaison » — pure — se teste à part.
   La feuille se lit par son arbre : c'est elle qui anime.
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
  /* Une entrée pour la cible, qui entre (ou sort) par le bas ou par le haut. */
  fire(target: Element, isIntersecting: boolean, top = isIntersecting ? 400 : 2000) {
    const rect = { top, bottom: top + 100, left: 0, right: 100, width: 100, height: 100 };
    const entry = { target, isIntersecting, boundingClientRect: rect } as IntersectionObserverEntry;
    act(() => this.callback([entry], this as unknown as IntersectionObserver));
  }
}

let supportsViewTimeline = false;
let reducedMotion = false;
/* La position de l'élément à son montage, en pixels depuis le haut de la vue. */
let mountTop = 2000;

beforeEach(() => {
  supportsViewTimeline = false;
  reducedMotion = false;
  mountTop = 2000;
  FakeIntersectionObserver.all.length = 0;
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('CSS', {
    supports: (condition: string) =>
      condition.replace(/\s+/g, '') === 'animation-timeline:view()' && supportsViewTimeline,
  });
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({ top: mountTop, bottom: mountTop + 100, height: 100 }) as DOMRect,
  );
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
  vi.unstubAllGlobals();
});

const renderReveal = (props: Partial<RevealProps> = {}) =>
  render(
    <Reveal data-testid="reveal" {...props}>
      <p>Accessible</p>
    </Reveal>,
  );

const node = () => screen.getByTestId('reveal');
const observer = () => FakeIntersectionObserver.all[0];

describe('isBelowFold', () => {
  it('dit sous la ligne de flottaison un élément dont le haut est au bas de la vue ou plus bas', () => {
    expect(isBelowFold({ top: 800 }, 800)).toBe(true);
    expect(isBelowFold({ top: 1200 }, 800)).toBe(true);
  });

  it('ne dit jamais caché un élément déjà dans la vue, même en partie, ni au-dessus', () => {
    expect(isBelowFold({ top: 0 }, 800)).toBe(false);
    expect(isBelowFold({ top: 799 }, 800)).toBe(false);
    expect(isBelowFold({ top: -400 }, 800)).toBe(false);
  });

  it('ne cache rien sans hauteur de vue connue', () => {
    expect(isBelowFold({ top: 1200 }, 0)).toBe(false);
  });
});

describe('Reveal — rendu', () => {
  it('rend un `div` par défaut, avec sa classe stable, ses props et sa ref', () => {
    const ref = createRef<HTMLDivElement>();
    renderReveal({ ref, className: 'maison', id: 'bloc', 'aria-label': 'Qualités' });
    expect(node().tagName).toBe('DIV');
    expect(node()).toHaveClass('opale-reveal', 'maison');
    expect(node()).toHaveAttribute('id', 'bloc');
    expect(node()).toHaveAttribute('aria-label', 'Qualités');
    expect(ref.current).toBe(node());
  });

  it('rend l’élément demandé par `as`', () => {
    render(
      <ul>
        <Reveal as="li" data-testid="reveal">
          Un
        </Reveal>
      </ul>,
    );
    expect(node().tagName).toBe('LI');
  });

  it('pose le pas de décalage de `delay`, sans toucher au `style` de l’appelant', () => {
    renderReveal({ delay: 2, style: { color: 'red' } });
    expect(node().style.getPropertyValue('--opale-reveal-index')).toBe('2');
    expect(node().style.color).toBe('red');
  });

  it('ne pose aucun pas sans `delay`', () => {
    renderReveal();
    expect(node().getAttribute('style')).toBeNull();
  });
});

describe('Reveal — natif (animation-timeline: view())', () => {
  it('ne crée aucun observateur et ne pose aucun état : la feuille anime seule', () => {
    supportsViewTimeline = true;
    renderReveal();
    expect(FakeIntersectionObserver.all).toHaveLength(0);
    expect(node()).not.toHaveAttribute('data-reveal');
  });
});

describe('Reveal — repli IntersectionObserver', () => {
  it('ne cache jamais un élément déjà dans la vue au montage, et ne l’observe pas', () => {
    mountTop = 200;
    renderReveal();
    expect(node()).not.toHaveAttribute('data-reveal');
    expect(FakeIntersectionObserver.all).toHaveLength(0);
  });

  it('met en attente un élément sous la ligne de flottaison, puis le montre à son entrée', () => {
    renderReveal();
    expect(node()).toHaveAttribute('data-reveal', 'pending');
    expect(observer().options?.rootMargin).toBe('0px 0px -10% 0px');
    expect(observer().targets.has(node())).toBe(true);
    observer().fire(node(), true);
    expect(node()).toHaveAttribute('data-reveal', 'shown');
  });

  it('cesse d’observer après la première apparition (`once`, par défaut)', () => {
    renderReveal();
    observer().fire(node(), true);
    expect(observer().disconnected).toBe(true);
    observer().fire(node(), false);
    expect(node()).toHaveAttribute('data-reveal', 'shown');
  });

  it('se cache de nouveau sous la vue avec `once={false}`, jamais au-dessus', () => {
    renderReveal({ once: false });
    observer().fire(node(), true);
    observer().fire(node(), false, -600);
    expect(node()).toHaveAttribute('data-reveal', 'shown');
    observer().fire(node(), false, 2000);
    expect(node()).toHaveAttribute('data-reveal', 'pending');
    expect(observer().disconnected).toBe(false);
  });

  it('montre l’élément en attente dès que le focus y entre, même hors de la marge', () => {
    const onFocus = vi.fn();
    render(
      <Reveal data-testid="reveal" onFocus={onFocus}>
        <a href="#suite">Suite</a>
      </Reveal>,
    );
    expect(node()).toHaveAttribute('data-reveal', 'pending');
    act(() => screen.getByRole('link', { name: 'Suite' }).focus());
    expect(node()).toHaveAttribute('data-reveal', 'shown');
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('déconnecte l’observateur au démontage', () => {
    const { unmount } = renderReveal();
    const watching = observer();
    unmount();
    expect(watching.disconnected).toBe(true);
  });

  it('ne cache rien sans `IntersectionObserver`', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    renderReveal();
    expect(node()).not.toHaveAttribute('data-reveal');
  });

  it('se replie sur l’observateur sans `CSS.supports`', () => {
    vi.stubGlobal('CSS', undefined);
    renderReveal();
    expect(node()).toHaveAttribute('data-reveal', 'pending');
  });
});

describe('Reveal — mouvement réduit', () => {
  it('ne cache rien et n’observe rien sous `prefers-reduced-motion: reduce`', () => {
    reducedMotion = true;
    renderReveal();
    expect(node()).not.toHaveAttribute('data-reveal');
    expect(FakeIntersectionObserver.all).toHaveLength(0);
  });
});

describe('Reveal — feuille', () => {
  const nativeContext = '@supports (animation-timeline: view())';

  it('prend ses réglages dans les jetons de `:root`', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-reveal-distance')).toBe('1.5rem');
    expect(root.get('--opale-reveal-duration')).toBe('720ms');
    expect(root.get('--opale-reveal-stagger')).toBe('60ms');
    expect(root.get('--opale-ease-reveal')).toBe('cubic-bezier(0.2, 0.7, 0.2, 1)');
  });

  it('lie la montée native à la vue, et seulement sous `@supports`', () => {
    const native = declarations(sheet, '.root', { within: nativeContext });
    expect(native.get('animation-fill-mode')).toBe('both');
    expect(native.get('animation-timing-function')).toBe('var(--opale-ease-reveal)');
    expect(native.get('animation-timeline')).toBe('view()');
    expect(native.get('animation-range')).toBe(
      'entry calc(var(--opale-reveal-index, 0) * 10%) entry calc(80% + var(--opale-reveal-index, 0) * 10%)',
    );
    expect(declaration(sheet, '.root', 'animation-name')).toBeUndefined();
  });

  it('est visible au repos : aucune règle de premier niveau ne cache `.root`', () => {
    const rest = declarations(sheet, '.root');
    expect(rest.get('opacity')).toBeUndefined();
    expect(rest.get('transform')).toBeUndefined();
    expect(rest.get('visibility')).toBeUndefined();
  });

  it('ne cache que l’attente, et la montre par `transform` et `opacity`', () => {
    const pending = declarations(sheet, ".root[data-reveal='pending']");
    expect(pending.get('opacity')).toBe('0');
    expect(pending.get('transform')).toContain('var(--opale-reveal-distance');
    const shown = declarations(sheet, ".root[data-reveal='shown']");
    expect(shown.get('transition-property')).toBe('opacity, transform');
    expect(shown.get('transition-delay')).toContain('var(--opale-reveal-index');
    expect(shown.get('transition-delay')).toContain('var(--opale-reveal-stagger');
  });

  it('n’anime que `transform` et `opacity` : aucune mise en page', () => {
    const keyframes = sheet.match(/@keyframes[^{]+\{([\s\S]*?\})\s*\}/)?.[1] ?? '';
    const animated = [...keyframes.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1]);
    expect(new Set(animated)).toEqual(new Set(['opacity', 'transform']));
    expect(selectorsDeclaring(sheet, 'transition-property')).toEqual([
      ".root[data-reveal='shown']",
    ]);
  });

  /* Chromium ignore un délai en temps sur une timeline `view()` : la cascade
     native décale la plage, de 10 % de l'entrée par rang. */
  it('décale par `delay` la plage de la montée native, pas son délai', () => {
    expect(
      declaration(sheet, '.root', 'animation-delay', { within: nativeContext }),
    ).toBeUndefined();
    expect(
      declaration(sheet, '.root', 'animation-range', { within: nativeContext }),
    ).toContain('var(--opale-reveal-index, 0) * 10%');
  });

  it.each(['@media (prefers-reduced-motion: reduce)', '@media print'])(
    'montre tout au repos sous %s',
    (within) => {
      const rest = declarations(sheet, ".root[data-reveal='pending']", { within });
      expect(rest.get('opacity')).toBe('1');
      expect(rest.get('transform')).toBe('none');
      const root = declarations(sheet, '.root', { within });
      expect(root.get('animation')).toBe('none');
      expect(root.get('transition')).toBe('none');
      expect(declaration(sheet, ".root[data-reveal='shown']", 'transition', { within })).toBe(
        'none',
      );
    },
  );
});

describe('Reveal — rendu serveur', () => {
  const fixture = () => (
    <Reveal as="section" delay={1}>
      <h2>Qualités</h2>
    </Reveal>
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

  it('rend le contenu à son état final : ni attente, ni opacité, ni transformation', () => {
    const html = renderOnServer();
    expect(html).toContain('Qualités');
    expect(html).not.toContain('data-reveal');
    expect(html).not.toMatch(/\shidden[=\s>]/);
    expect(html).not.toMatch(/opacity/);
    expect(html).not.toMatch(/transform/);
    expect(html).toMatch(/^<section class="opale-reveal[\s"]/);
  });

  it('s’hydrate sans écart sous StrictMode', async () => {
    mountTop = 200;
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
    expect(host.querySelector('section')).not.toHaveAttribute('data-reveal');
    await act(async () => root?.unmount());
    host.remove();
  });
});
