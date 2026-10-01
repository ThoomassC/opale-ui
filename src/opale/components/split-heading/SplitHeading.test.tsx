import { act, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SplitHeading,
  RIGHT_TO_LEFT,
  splitWords,
  type SplitHeadingProps,
  type SplitHeadingTrigger,
} from './SplitHeading';
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

/* Les animations des mots, telles que `getAnimations` les rend : une seule,
   dont on règle la fin à la main (`settle`). `undefined` : pas d'API. */
let animations: { finished: Promise<unknown> }[] | undefined;
let settle: (outcome: 'fulfilled' | 'rejected') => void;
const getAnimations = vi.fn(() => animations);
/* La position du titre à son montage, en pixels depuis le haut de la vue. */
let mountTop = 2000;
/* Sa position en largeur : un titre hors de la vue sur le côté (une diapositive
   de carrousel) n'est pas « à l'écran ». */
let mountLeft = 0;

beforeEach(() => {
  const finished = new Promise((resolve, reject) => {
    settle = (outcome) =>
      outcome === 'fulfilled' ? resolve(undefined) : reject(new Error('annulée'));
  });
  /* Une annulation n'est pas une erreur non traitée : le composant l'attend. */
  finished.catch(() => {});
  animations = [{ finished }];
  getAnimations.mockClear();
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    get: () => (animations ? getAnimations : undefined),
  });
  mountTop = 2000;
  mountLeft = 0;
  FakeIntersectionObserver.all.length = 0;
  resetWarnings();
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1280);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        top: mountTop,
        bottom: mountTop + 60,
        height: 60,
        left: mountLeft,
        right: mountLeft + 100,
        width: 100,
      }) as DOMRect,
  );
});

afterEach(() => {
  delete (Element.prototype as { getAnimations?: unknown }).getAnimations;
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
  /* Chaque mot, ses parties recollées : la forme qu'on lit. */
  const words = (text: string) => splitWords(text).map((parts) => parts.join(''));

  it('découpe sur les espaces, sans mot vide en tête ni en queue', () => {
    expect(words('  Un titre\nqui\tprend  son temps.  ')).toEqual([
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
    expect(words('Vraiment ? Oui !')).toEqual(['Vraiment ?', 'Oui !']);
    expect(words('Il dit « bonjour » — puis part.')).toEqual([
      'Il',
      'dit',
      '« bonjour » —',
      'puis',
      'part.',
    ]);
    expect(words('( entre parenthèses )')).toEqual(['( entre', 'parenthèses )']);
  });

  it('ne coupe pas sur une espace insécable', () => {
    expect(words('Le temps\u00a0? 20\u202f%')).toEqual(['Le', 'temps\u00a0?', '20\u202f%']);
  });

  it('laisse en un seul mot un texte sans espace (CJK)', () => {
    expect(words('一个不需要空格的标题')).toEqual(['一个不需要空格的标题']);
  });

  it('découpe un texte de droite à gauche comme un autre', () => {
    expect(words('عنوان يأخذ وقته.')).toEqual(['عنوان', 'يأخذ', 'وقته.']);
  });

  it('ne rend aucun mot d’un texte vide', () => {
    expect(words('   ')).toEqual([]);
  });

  /* Les espaces sécables d'Unicode séparent ; les insécables (U+00A0, U+2007,
     U+202F) et le gluon U+2060 restent dans le mot. */
  it('sépare sur les espaces sécables d’Unicode, jamais sur les insécables', () => {
    expect(words('a\u2003b\u2009c\u205fd\u3000e\u2000f\u200ag')).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
    ]);
    expect(words('a\u00a0b c\u2007d e\u202ff g\u2060h')).toEqual([
      'a\u00a0b',
      'c\u2007d',
      'e\u202ff',
      'g\u2060h',
    ]);
  });

  /* Le texte brut coupe la ligne après un trait d'union ou une barre entre
     deux lettres : le mot y est coupé en parties, le signe à gauche, sans
     espace ajoutée. */
  it('coupe en parties après `-` et `/` entre deux lettres', () => {
    expect(splitWords('Anticonstitutionnellement-parlant, une')).toEqual([
      ['Anticonstitutionnellement-', 'parlant,'],
      ['une'],
    ]);
    expect(splitWords('Est-ce peut-être et/ou')).toEqual([
      ['Est-', 'ce'],
      ['peut-', 'être'],
      ['et/', 'ou'],
    ]);
  });

  it('ne coupe pas un signe qui n’est pas entre deux lettres', () => {
    expect(splitWords('20-30 -5 a- /b http://x')).toEqual([
      ['20-30'],
      ['-5'],
      ['a-'],
      ['/b'],
      ['http://x'],
    ]);
  });
});

describe('RIGHT_TO_LEFT', () => {
  it('reconnaît l’hébreu, l’arabe et leurs formes de présentation', () => {
    for (const text of ['שלום', 'عنوان', 'ܐ', '\ufb1d', '\ufdf0', '\ufe70', '\ufefc'])
      expect(RIGHT_TO_LEFT.test(text), text).toBe(true);
  });

  it('laisse passer le latin, le cyrillique, le grec et le CJK', () => {
    for (const text of ['Bonjour', 'Привет', 'Γειά', '一个标题', 'Café, «\u00a0oui\u00a0»'])
      expect(RIGHT_TO_LEFT.test(text), text).toBe(false);
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

describe('SplitHeading — découpe et bords', () => {
  it('coupe après un trait d’union sans ajouter d’espace, et numérote chaque partie', () => {
    const sentence = 'Est-ce peut-être et/ou le bon moment ?';
    renderSplit({ children: sentence });
    expect(heading().querySelector('[aria-hidden="true"]')?.textContent).toBe(sentence);
    expect(words().map((word) => word.textContent)).toEqual([
      'Est-',
      'ce',
      'peut-',
      'être',
      'et/',
      'ou',
      'le',
      'bon',
      'moment ?',
    ]);
    expect(
      words().map((word) => (word as HTMLElement).style.getPropertyValue('--opale-split-index')),
    ).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
  });

  /* Un `inline-block` est neutre pour l'algorithme bidi : des mots hébreux ou
     arabes découpés s'afficheraient en ordre inverse sur une page LTR. */
  it.each(['שלום עולם', 'عنوان يأخذ وقته.', 'Le mot שלום au milieu'])(
    'rend sans découpe ni animation un texte de droite à gauche : %s',
    (sentence) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderSplit({ children: sentence, trigger: 'mount' });
      expect(screen.getByRole('heading', { name: sentence })).toBe(heading());
      expect(heading()).toHaveTextContent(sentence);
      expect(heading().childNodes).toHaveLength(1);
      expect(heading().querySelector('[aria-hidden]')).toBeNull();
      expect(words()).toHaveLength(0);
      expect(heading()).not.toHaveAttribute('data-split');
      expect(warn).not.toHaveBeenCalled();
    },
  );

  /* Un titre vide n'a pas de nom accessible. */
  it.each(['', '   '])('avertit en développement d’un titre vide (%j)', (empty) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderSplit({ children: empty });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/\[Opale\] SplitHeading/);
  });
});

describe('SplitHeading — déclencheur `mount`', () => {
  it('joue au montage, avant la première peinture, sans observateur', () => {
    renderSplit({ trigger: 'mount' });
    expect(heading()).toHaveAttribute('data-split', 'play');
    expect(FakeIntersectionObserver.all).toHaveLength(0);
  });

  /* Le mouvement réduit n'est pas lu par le script : la feuille y retire
     l'animation (voir « feuille »), il n'y a donc rien à attendre. */
  it('finit aussitôt la lecture quand la feuille ne laisse aucune animation', async () => {
    animations = [];
    renderSplit({ trigger: 'mount' });
    await act(async () => {});
    expect(heading()).toHaveAttribute('data-split', 'done');
  });
});

describe('SplitHeading — déclencheur `view` (par défaut)', () => {
  it('reste immobile sous la vue, puis joue à son entrée, une fois', () => {
    renderSplit();
    expect(heading()).not.toHaveAttribute('data-split');
    /* Aucune marge en bas : pas de bande morte au bas de la vue. Une marge
       sans fin en haut : un titre dépassé d'un saut compte comme vu. */
    expect(observer().options?.rootMargin).toBe('100000px 0px 0px');
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

  /* La marge sans fin en haut : un saut (touche Fin, ancre) qui fait passer
     le titre au-dessus de la vue le laisse « dans la vue » de l'observateur,
     qui le signale comme une entrée. */
  it('compte comme vu un titre qu’un saut a fait passer au-dessus de la vue', () => {
    renderSplit();
    observer().fire(heading(), true, -600);
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

  it.each([1400, -300])(
    'passe par l’observateur un titre hors de la vue sur le côté (gauche : %i px)',
    (left) => {
      mountTop = 200;
      mountLeft = left;
      renderSplit();
      expect(heading()).not.toHaveAttribute('data-split');
      expect(FakeIntersectionObserver.all).toHaveLength(1);
      observer().fire(heading(), true);
      expect(heading()).toHaveAttribute('data-split', 'play');
    },
  );

  it('reste simplement immobile sans `IntersectionObserver`', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    renderSplit();
    expect(heading()).not.toHaveAttribute('data-split');
  });

  it('déconnecte l’observateur au démontage', () => {
    const { unmount } = renderSplit();
    const watching = observer();
    unmount();
    expect(watching.disconnected).toBe(true);
  });
});

describe('SplitHeading — une seule lecture', () => {
  const mount = (children = SENTENCE, props: Partial<SplitHeadingProps> = {}) => (
    <SplitHeading trigger="mount" {...props}>
      {children}
    </SplitHeading>
  );
  const finish = () => act(async () => settle('fulfilled'));

  /* `done` retire la règle d'animation : rien ne peut plus la relancer. */
  it('passe à `done` quand toutes les animations des mots sont finies', async () => {
    render(mount());
    await act(async () => {});
    expect(heading()).toHaveAttribute('data-split', 'play');
    expect(getAnimations).toHaveBeenCalledWith({ subtree: true });
    await finish();
    expect(heading()).toHaveAttribute('data-split', 'done');
  });

  /* Un `display: none` en pleine lecture annule les animations : sans `done`,
     elles repartiraient de zéro au retour. L'annulation y mène aussi. */
  it('passe à `done` quand les animations sont annulées', async () => {
    render(mount());
    await act(async () => settle('rejected'));
    expect(heading()).toHaveAttribute('data-split', 'done');
  });

  it('finit aussitôt sans `getAnimations` : le titre reste immobile', async () => {
    animations = undefined;
    render(mount());
    await act(async () => {});
    expect(heading()).toHaveAttribute('data-split', 'done');
  });

  it('ne rejoue pas après `display: none`, ni quand `level` change', async () => {
    const { rerender } = render(mount());
    await finish();
    rerender(mount(SENTENCE, { style: { display: 'none' } }));
    rerender(mount());
    expect(heading()).toHaveAttribute('data-split', 'done');
    rerender(mount(SENTENCE, { level: 3 }));
    expect(heading().tagName).toBe('H3');
    expect(heading()).toHaveAttribute('data-split', 'done');
  });

  it('montre immobile un nouveau texte après la lecture', async () => {
    const { rerender } = render(mount());
    await finish();
    rerender(mount('Un autre titre.'));
    expect(screen.getByRole('heading', { name: 'Un autre titre.' })).toHaveAttribute(
      'data-split',
      'done',
    );
    expect(words().map((word) => word.textContent)).toEqual(['Un', 'autre', 'titre.']);
  });

  /* Le choix le plus simple qui reste cohérent : pas de cascade à moitié
     rejouée sur des mots neufs, la phrase entière, immobile — dès ce rendu. */
  it('montre immobile un texte changé pendant la lecture', () => {
    const { rerender } = render(mount());
    expect(heading()).toHaveAttribute('data-split', 'play');
    rerender(mount('Un autre titre.'));
    expect(heading()).toHaveAttribute('data-split', 'done');
  });

  it('rend des mots neufs, et non ceux d’avant réutilisés, quand le texte change', () => {
    const { rerender } = render(mount());
    const before = words()[0];
    rerender(mount('Un autre titre.'));
    expect(words()[0]).toHaveTextContent('Un');
    expect(words()[0]).not.toBe(before);
  });
});

describe('SplitHeading — rendu serveur et hydratation', () => {
  const fixture = (trigger: SplitHeadingTrigger = 'mount') => (
    <SplitHeading level={1} trigger={trigger}>
      {SENTENCE}
    </SplitHeading>
  );

  const renderOnServer = (trigger?: SplitHeadingTrigger) => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      return renderToString(fixture(trigger));
    } finally {
      vi.unstubAllGlobals();
      /* `unstubAllGlobals` retire aussi la fausse : on la remet pour le client. */
      vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    }
  };

  /* Hydrate sous StrictMode et rend l'hôte, les erreurs, et de quoi démonter. */
  const hydrate = async (trigger?: SplitHeadingTrigger) => {
    const host = document.createElement('div');
    host.innerHTML = renderOnServer(trigger);
    document.body.append(host);
    const errors: string[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, <StrictMode>{fixture(trigger)}</StrictMode>, {
          onRecoverableError: (error) => errors.push(String(error)),
        });
      });
    } finally {
      consoleError.mockRestore();
    }
    const cleanup = async () => {
      await act(async () => root?.unmount());
      host.remove();
    };
    return { host, errors, cleanup };
  };

  it('rend chaque mot à son état final : ni lecture, ni opacité, ni transformation', () => {
    const html = renderOnServer();
    expect(html).toMatch(/^<h1 class="opale-heading opale-split-heading[\s"]/);
    expect(html).not.toContain('data-split');
    expect(html).not.toMatch(/opacity|transform|\shidden[=\s>]/);
    expect(html.match(/opale-split-heading__word/g)).toHaveLength(6);
  });

  /* Les mots du serveur sont déjà peints : les rejouer à l'hydratation les
     ferait tomber à l'opacité nulle, puis remonter — l'éclair interdit. */
  it.each(['mount', 'view'] as const)(
    's’hydrate sans écart et ne rejoue pas un titre déjà à l’écran (`%s`)',
    async (trigger) => {
      mountTop = 200;
      const { host, errors, cleanup } = await hydrate(trigger);
      expect(errors).toEqual([]);
      expect(host.querySelector('h1')).not.toHaveAttribute('data-split');
      expect(FakeIntersectionObserver.all).toHaveLength(0);
      await cleanup();
    },
  );

  it('joue à son entrée un titre hydraté sous la ligne de flottaison (`view`)', async () => {
    const { host, errors, cleanup } = await hydrate('view');
    expect(errors).toEqual([]);
    const h1 = host.querySelector('h1')!;
    expect(h1).not.toHaveAttribute('data-split');
    const watching = FakeIntersectionObserver.all.at(-1)!;
    watching.fire(h1, true);
    expect(h1).toHaveAttribute('data-split', 'play');
    await cleanup();
  });

  it('ne joue jamais un titre `mount` hydraté, même sous la vue', async () => {
    const { host, cleanup } = await hydrate('mount');
    expect(host.querySelector('h1')).not.toHaveAttribute('data-split');
    await cleanup();
  });
});

describe('SplitHeading — feuille', () => {
  const play = ".root[data-split='play'] > [aria-hidden] > span";
  const word = '.root > [aria-hidden] > span';

  it('prend ses réglages dans les jetons de `:root`', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-split-stagger')).toBe('70ms');
    expect(root.get('--opale-split-duration')).toBe('640ms');
    expect(root.get('--opale-split-distance')).toBe('0.35em');
    expect(root.get('--opale-ease-reveal')).toBe('cubic-bezier(0.2, 0.7, 0.2, 1)');
  });

  it('pose chaque mot en `inline-block` dès le rendu serveur', () => {
    expect(declaration(sheet, word, 'display')).toBe('inline-block');
  });

  it('est visible au repos : aucune règle hors lecture ne cache un mot', () => {
    for (const selector of ['.root', word]) {
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
    expect(declaration(sheet, '.root > [aria-hidden] + span', 'user-select')).toBe('none');
    /* Safari ne lit encore que la forme préfixée. */
    expect(declaration(sheet, '.root > [aria-hidden] + span', '-webkit-user-select')).toBe('none');
  });
});
