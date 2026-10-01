import { act, render, screen } from '@testing-library/react';
import { createRef, StrictMode, type ReactNode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SplitHeading, type SplitHeadingProps } from './SplitHeading';
import { splitWords } from './split-words';
import { resetWarnings } from '../../shared/dev-warning';
import { declaration, declarations, selectorsDeclaring } from '../../../test/css-rules';
import sheet from './style/SplitHeading.module.css?raw';
import opaleSource from '../../opale.css?raw';

/* =============================================================================
   LE TITRE DÉCOUPÉ EN MOTS, MESURÉ CONTRE SES CRITÈRES.

   jsdom n'a ni mise en page ni animation : `IntersectionObserver` est une
   fausse qu'on déclenche à la main, `getBoundingClientRect` rend la position
   qu'on choisit, et le découpage — pur — se teste à part. La feuille se lit
   par son arbre : c'est elle qui anime, et c'est elle qui garde tout visible
   au repos.
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
  /* Une entrée pour la cible ; `rootBounds` est la vue réelle. */
  fire(target: Element, isIntersecting: boolean, top = isIntersecting ? 400 : 2000) {
    const rect = { top, bottom: top + 60, left: 0, right: 100, width: 100, height: 60 };
    const rootBounds = { top: 0, bottom: 800, left: 0, right: 1280, width: 1280, height: 800 };
    const entry = {
      target,
      isIntersecting,
      boundingClientRect: rect,
      rootBounds,
    } as IntersectionObserverEntry;
    act(() => this.callback([entry], this as unknown as IntersectionObserver));
  }
}

let reducedMotion = false;
/* La position du titre à son montage, en pixels depuis le haut de la vue. */
let mountTop = 2000;

beforeEach(() => {
  reducedMotion = false;
  mountTop = 2000;
  FakeIntersectionObserver.all.length = 0;
  resetWarnings();
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({ top: mountTop, bottom: mountTop + 60, height: 60 }) as DOMRect,
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

const SENTENCE = 'Un titre qui prend son temps.';

const renderSplit = (props: Partial<SplitHeadingProps> = {}) =>
  render(<SplitHeading {...props}>{props.children ?? SENTENCE}</SplitHeading>);

const heading = () => screen.getByRole('heading');
const words = () => [...heading().querySelectorAll('.opale-split-heading__word')];
const observer = () => FakeIntersectionObserver.all[0];

describe('splitWords', () => {
  it('découpe sur les espaces, sans mot vide en tête ni en queue', () => {
    expect(splitWords('  Un titre\nqui\tprend  son temps.  ')).toEqual([
      'Un',
      'titre',
      'qui',
      'prend',
      'son',
      'temps.',
    ]);
  });

  /* Le texte brut ne coupe jamais avant « ! » ni après « « » (UAX 14) ; des
     mots en `inline-block` le pourraient : la ponctuation isolée reste donc
     collée à son mot. */
  it('garde la ponctuation isolée avec son mot', () => {
    expect(splitWords('Vraiment ? Oui !')).toEqual(['Vraiment ?', 'Oui !']);
    expect(splitWords('Il dit « bonjour » — puis part.')).toEqual([
      'Il',
      'dit',
      '« bonjour » —',
      'puis',
      'part.',
    ]);
    expect(splitWords('( entre parenthèses )')).toEqual(['( entre', 'parenthèses )']);
  });

  it('ne coupe pas sur une espace insécable', () => {
    expect(splitWords('Le temps\u00a0? 20\u202f%')).toEqual(['Le', 'temps\u00a0?', '20\u202f%']);
  });

  it('laisse en un seul mot un texte sans espace (CJK)', () => {
    expect(splitWords('一个不需要空格的标题')).toEqual(['一个不需要空格的标题']);
  });

  it('découpe un texte de droite à gauche comme un autre', () => {
    expect(splitWords('عنوان يأخذ وقته.')).toEqual(['عنوان', 'يأخذ', 'وقته.']);
  });

  it('ne rend aucun mot d’un texte vide', () => {
    expect(splitWords('   ')).toEqual([]);
  });
});

describe('SplitHeading — rendu', () => {
  it('rend un `h2` par défaut, avec ses classes, ses props et sa ref', () => {
    const ref = createRef<HTMLHeadingElement>();
    renderSplit({ ref, className: 'maison', id: 'titre', style: { color: 'red' } });
    expect(heading().tagName).toBe('H2');
    expect(heading()).toHaveClass('opale-heading', 'opale-split-heading', 'maison');
    expect(heading()).toHaveAttribute('id', 'titre');
    expect(heading().style.color).toBe('red');
    expect(ref.current).toBe(heading());
  });

  it.each([1, 2, 3, 4, 5, 6] as const)('rend le niveau %i', (level) => {
    renderSplit({ level });
    expect(screen.getByRole('heading', { level, name: SENTENCE })).toBeInTheDocument();
  });

  it('n’envoie pas `by` ni `trigger` au DOM', () => {
    renderSplit({ by: 'word', trigger: 'mount' });
    expect(heading()).not.toHaveAttribute('by');
    expect(heading()).not.toHaveAttribute('trigger');
  });
});

describe('SplitHeading — accessibilité', () => {
  it('porte la phrase entière pour nom, sans `aria-label`', () => {
    renderSplit();
    expect(screen.getByRole('heading', { level: 2, name: SENTENCE })).toBe(heading());
    expect(heading()).not.toHaveAttribute('aria-label');
    expect(heading()).not.toHaveAttribute('aria-labelledby');
  });

  it('rend une seule copie lisible, cachée de l’écran', () => {
    renderSplit();
    const readable = heading().querySelectorAll('.opale-visually-hidden');
    expect(readable).toHaveLength(1);
    expect(readable[0]).toHaveTextContent(SENTENCE);
    expect(readable[0]).not.toHaveAttribute('aria-hidden');
  });

  it('cache les mots visibles des techniques d’assistance', () => {
    renderSplit();
    const visible = heading().querySelector('[aria-hidden="true"]');
    expect(visible).not.toBeNull();
    expect(words().every((word) => visible?.contains(word))).toBe(true);
    expect(words().map((word) => word.textContent)).toEqual([
      'Un',
      'titre',
      'qui',
      'prend',
      'son',
      'temps.',
    ]);
  });

  it('garde une espace entre deux mots, et chacun son rang dans la cascade', () => {
    renderSplit();
    expect(heading().querySelector('[aria-hidden="true"]')?.textContent).toBe(SENTENCE);
    expect(
      words().map((word) => (word as HTMLElement).style.getPropertyValue('--opale-split-index')),
    ).toEqual(['0', '1', '2', '3', '4', '5']);
  });
});

describe('SplitHeading — enfant qui n’est pas du texte', () => {
  const rich = (
    <>
      Un <em>titre</em>
    </>
  );
  const renderRich = () => render(<SplitHeading>{rich as unknown as string}</SplitHeading>);

  it('le rend tel quel, sans découpe, et l’avertit une fois en développement', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { unmount } = renderRich();
    expect(screen.getByRole('heading', { name: 'Un titre' })).toBeInTheDocument();
    expect(heading().querySelector('em')).toHaveTextContent('titre');
    expect(words()).toHaveLength(0);
    expect(heading().querySelector('[aria-hidden="true"]')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/\[Opale\] SplitHeading/);
    unmount();
    renderRich();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('n’avertit pas pour un texte', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderSplit();
    expect(warn).not.toHaveBeenCalled();
  });

  it('n’anime pas un enfant qu’il n’a pas découpé', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SplitHeading trigger="mount">{(<em>Riche</em>) as unknown as string}</SplitHeading>);
    expect(heading()).not.toHaveAttribute('data-split');
  });
});

describe('SplitHeading — déclencheur `mount`', () => {
  it('joue au montage, avant la première peinture, sans observateur', () => {
    renderSplit({ trigger: 'mount' });
    expect(heading()).toHaveAttribute('data-split', 'play');
    expect(FakeIntersectionObserver.all).toHaveLength(0);
  });

  it('ne joue rien sous `prefers-reduced-motion: reduce`', () => {
    reducedMotion = true;
    renderSplit({ trigger: 'mount' });
    expect(heading()).not.toHaveAttribute('data-split');
  });
});

describe('SplitHeading — déclencheur `view` (par défaut)', () => {
  it('reste immobile sous la vue, puis joue à son entrée, une fois', () => {
    renderSplit();
    expect(heading()).not.toHaveAttribute('data-split');
    /* Aucune marge en bas : pas de bande morte au bas de la vue. Une marge
       sans fin en haut : un titre dépassé d'un saut compte comme vu. */
    expect(observer().options?.rootMargin).toBe('100000px 0px 0px 0px');
    /* Il suit les mots, que `ref` n'a pas à partager. */
    expect(observer().targets.has(heading().querySelector('[aria-hidden="true"]')!)).toBe(true);
    observer().fire(heading(), true);
    expect(heading()).toHaveAttribute('data-split', 'play');
    expect(observer().disconnected).toBe(true);
  });

  it('ne joue pas tant que le titre reste sous la vue', () => {
    renderSplit();
    observer().fire(heading(), false);
    expect(heading()).not.toHaveAttribute('data-split');
    expect(observer().disconnected).toBe(false);
  });

  it('compte comme vu un titre qu’un saut a fait passer au-dessus de la vue', () => {
    renderSplit();
    observer().fire(heading(), false, -600);
    expect(heading()).toHaveAttribute('data-split', 'play');
    expect(observer().disconnected).toBe(true);
  });

  /* L'observateur ne prévient qu'après une peinture : un titre déjà à
     l'écran montrerait ses mots, les cacherait, puis les animerait. */
  it('joue tout de suite un titre déjà à l’écran au montage, sans observer', () => {
    mountTop = 200;
    renderSplit();
    expect(heading()).toHaveAttribute('data-split', 'play');
    expect(FakeIntersectionObserver.all).toHaveLength(0);
  });

  it('reste simplement immobile sans `IntersectionObserver`', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    renderSplit();
    expect(heading()).not.toHaveAttribute('data-split');
  });

  it('n’observe rien sous `prefers-reduced-motion: reduce`', () => {
    reducedMotion = true;
    renderSplit();
    expect(FakeIntersectionObserver.all).toHaveLength(0);
    expect(heading()).not.toHaveAttribute('data-split');
  });

  it('déconnecte l’observateur au démontage', () => {
    const { unmount } = renderSplit();
    const watching = observer();
    unmount();
    expect(watching.disconnected).toBe(true);
  });
});

describe('SplitHeading — rendu serveur', () => {
  const fixture = (children: ReactNode = SENTENCE) => (
    <SplitHeading level={1} trigger="mount">
      {children as string}
    </SplitHeading>
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

  it('rend chaque mot à son état final : ni lecture, ni opacité, ni transformation', () => {
    const html = renderOnServer();
    expect(html).toMatch(/^<h1 class="opale-heading opale-split-heading[\s"]/);
    expect(html).not.toContain('data-split');
    expect(html).not.toMatch(/opacity|transform|\shidden[=\s>]/);
    expect(html.match(/opale-split-heading__word/g)).toHaveLength(6);
  });

  it('s’hydrate sans écart sous StrictMode, puis joue', async () => {
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
    expect(host.querySelector('h1')).toHaveAttribute('data-split', 'play');
    await act(async () => root?.unmount());
    host.remove();
  });
});

describe('SplitHeading — feuille', () => {
  const play = ".root[data-split='play'] .word";

  it('prend ses réglages dans les jetons de `:root`', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-split-stagger')).toBe('70ms');
    expect(root.get('--opale-split-duration')).toBe('640ms');
    expect(root.get('--opale-split-distance')).toBe('0.35em');
    expect(root.get('--opale-ease-reveal')).toBe('cubic-bezier(0.2, 0.7, 0.2, 1)');
  });

  it('pose chaque mot en `inline-block` dès le rendu serveur', () => {
    expect(declaration(sheet, '.word', 'display')).toBe('inline-block');
  });

  it('est visible au repos : aucune règle hors lecture ne cache un mot', () => {
    for (const selector of ['.root', '.word']) {
      const rest = declarations(sheet, selector);
      expect(rest.get('opacity')).toBeUndefined();
      expect(rest.get('transform')).toBeUndefined();
      expect(rest.get('visibility')).toBeUndefined();
    }
    /* Seul le départ de l'animation cache : `from`, sans `to` — l'arrivée est le repos. */
    expect(selectorsDeclaring(sheet, 'opacity')).toEqual(['from']);
  });

  /* `backwards`, et non `both` : l'état caché ne vaut que pendant le délai et
     l'animation ; à la fin, le mot retombe sur son style de repos. */
  it('joue la montée en cascade, l’état de départ seulement pendant l’animation', () => {
    const rule = declarations(sheet, play);
    expect(rule.get('animation-name')).toBe('word');
    expect(rule.get('animation-duration')).toBe('var(--opale-split-duration)');
    expect(rule.get('animation-timing-function')).toBe('var(--opale-ease-reveal)');
    expect(rule.get('animation-fill-mode')).toBe('backwards');
    expect(rule.get('animation-delay')).toBe(
      'calc(var(--opale-split-index) * var(--opale-split-stagger))',
    );
  });

  it('n’anime que `transform` et `opacity` : aucune mise en page', () => {
    const keyframes = sheet.match(/@keyframes[^{]+\{([\s\S]*?\})\s*\}/)?.[1] ?? '';
    const animated = [...keyframes.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1]);
    expect(new Set(animated)).toEqual(new Set(['opacity', 'transform']));
    expect(keyframes).toContain('var(--opale-split-distance)');
    expect(selectorsDeclaring(sheet, 'transition')).toEqual([]);
  });

  it.each(['@media (prefers-reduced-motion: reduce)', '@media print'])(
    'n’anime rien sous %s',
    (within) => {
      expect(declaration(sheet, play, 'animation', { within })).toBe('none');
    },
  );

  /* Copier le titre rend la phrase une fois : la copie lisible, cachée de
     l'écran, ne se sélectionne pas. */
  it('exclut la copie lisible de la sélection', () => {
    expect(declaration(sheet, '.text', 'user-select')).toBe('none');
  });
});
