import postcss from 'postcss';
import { afterEach, describe, expect, it } from 'vitest';

import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   LE THÈME LOCAL DE PAGESCAFFOLD NE REPEINT PLUS LA MARQUE DE L'HÔTE.

   Le bloc clair était déclaré sur `:root` ET sur `[data-opale-page-theme='light']`.
   PageScaffold posant toujours cet attribut, ses 103 jetons étaient redéclarés
   sur la racine du gabarit, avec les valeurs d'Opale : un `:root {
   --opale-primary: #16a34a }` d'hôte donnait un bouton vert hors du gabarit et
   saphir dedans (mesuré au navigateur, audit THM-01).

   Le bloc local ne se redéclare plus que là où il CHANGE quelque chose : un
   gabarit clair sous un contexte sombre, un gabarit sombre sous un contexte
   clair. Ailleurs, il hérite — et la marque de l'hôte avec lui.

   CE TEST REJOUE LA CASCADE. Il ne lit pas un `getComputedStyle` (jsdom
   n'hérite pas les propriétés personnalisées) : il prend les règles de premier
   niveau de la feuille, les confronte à de vrais éléments par
   `Element.matches`, les départage par spécificité puis par ordre, et hérite
   du parent quand rien ne s'applique. C'est exactement ce que fait un moteur
   pour une propriété héritée, et rien de plus.
   ========================================================================== */

interface Declaration {
  readonly selector: string;
  readonly value: string;
  readonly specificity: readonly [number, number, number];
  readonly order: number;
}

/** L'indice de la parenthèse fermant celle qui s'ouvre en `open`. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1;
    else if (text[index] === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error(`parenthèse non refermée dans « ${text} »`);
}

/**
 * La spécificité d'un sélecteur simple ou composé, `:where` compris.
 * Suffisante pour les sélecteurs de thème de la feuille ; pas un moteur complet.
 */
function specificity(selector: string): [number, number, number] {
  const score: [number, number, number] = [0, 0, 0];
  let index = 0;

  while (index < selector.length) {
    const char = selector[index];
    if (selector.startsWith(':where(', index)) {
      index = closingParen(selector, index + ':where'.length) + 1;
    } else if (selector.startsWith(':not(', index) || selector.startsWith(':is(', index)) {
      const open = selector.indexOf('(', index);
      const close = closingParen(selector, open);
      const inner = specificity(selector.slice(open + 1, close));
      score[0] += inner[0];
      score[1] += inner[1];
      score[2] += inner[2];
      index = close + 1;
    } else if (char === '#') {
      score[0] += 1;
      index += 1;
      while (index < selector.length && /[\w-]/.test(selector[index])) index += 1;
    } else if (char === '[') {
      score[1] += 1;
      index = selector.indexOf(']', index) + 1;
    } else if (char === '.' || (char === ':' && selector[index + 1] !== ':')) {
      score[1] += 1;
      index += 1;
      while (index < selector.length && /[\w-]/.test(selector[index])) index += 1;
    } else if (/[a-z]/i.test(char)) {
      score[2] += 1;
      while (index < selector.length && /[\w-]/.test(selector[index])) index += 1;
    } else {
      index += 1;
    }
  }

  return score;
}

/** Les déclarations de `property` dans les règles de premier niveau de `css`. */
function declarationsOf(css: string, property: string): readonly Declaration[] {
  const found: Declaration[] = [];
  let order = 0;

  postcss.parse(css).each((node) => {
    if (node.type !== 'rule') return;
    node.each((child) => {
      if (child.type !== 'decl' || child.prop !== property) return;
      for (const selector of node.selectors) {
        order += 1;
        found.push({
          selector: selector.trim(),
          value: child.value.trim(),
          specificity: specificity(selector),
          order,
        });
      }
    });
  });

  return found;
}

function compare(one: Declaration, other: Declaration): number {
  for (let index = 0; index < 3; index += 1) {
    const gap = one.specificity[index] - other.specificity[index];
    if (gap !== 0) return gap;
  }
  return one.order - other.order;
}

/**
 * `Element.matches`, où `:host` ne correspond à rien : hors d'une racine
 * fantôme, c'est la règle — et jsdom refuse parfois de l'analyser.
 */
function matches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    const withoutHost = selector.replace(/:host(\([^)]*\))?\s*,\s*|,\s*:host(\([^)]*\))?/g, '');
    if (withoutHost === selector || /^:host/.test(withoutHost.trim())) return false;
    return element.matches(withoutHost);
  }
}

/** La déclaration gagnante d'une propriété HÉRITÉE pour `element`, et l'élément qui la porte. */
function winning(
  element: Element,
  property: string,
  css: string,
): { value: string; owner: Element } | undefined {
  const winner = declarationsOf(css, property)
    .filter((declaration) => matches(element, declaration.selector))
    .sort(compare)
    .at(-1);
  if (winner) return { value: winner.value, owner: element };
  return element.parentElement ? winning(element.parentElement, property, css) : undefined;
}

/** La valeur calculée, telle qu'écrite (les `var()` non substitués). */
function computed(element: Element, property: string, css: string): string | undefined {
  return winning(element, property, css)?.value;
}

/**
 * La valeur calculée, `var()` substitués LÀ OÙ LA PROPRIÉTÉ EST DÉCLARÉE —
 * c'est ce que fait le moteur : un jeton dérivé hérite de sa valeur déjà
 * résolue, il ne se recalcule pas sur l'enfant.
 */
function resolved(element: Element, property: string, css: string): string | undefined {
  const found = winning(element, property, css);
  if (!found) return undefined;
  return found.value.replace(
    /var\((--[\w-]+)\)/g,
    (_match, name: string) => resolved(found.owner, name, css) ?? `var(${name})`,
  );
}

/** Une pile d'éléments sous `<body>`, chacun avec ses attributs ; rend la feuille. */
function nest(...layers: ReadonlyArray<Record<string, string>>): Element {
  let parent: Element = document.body;
  for (const attributes of layers) {
    const element = document.createElement('div');
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    parent.append(element);
    parent = element;
  }
  const leaf = document.createElement('button');
  parent.append(leaf);
  return leaf;
}

const LIGHT = { 'data-opale-page-theme': 'light' };
const DARK = { 'data-opale-page-theme': 'dark' };

const OPALE_LIGHT_PRIMARY = '#315c9e';
const OPALE_DARK_PRIMARY = '#5d87cb';
const HOST_GREEN = '#16a34a';

/** La feuille d'Opale, suivie de la surcharge d'un hôte chargée APRÈS elle. */
const withHost = (host: string) => `${opaleSource}\n${host}`;
const HOST_ROOT = withHost(`:root { --opale-primary: ${HOST_GREEN}; }`);

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
});

describe('le thème local de PageScaffold', () => {
  it('laisse la marque de l’hôte traverser un gabarit clair', () => {
    expect(computed(nest(), '--opale-primary', HOST_ROOT)).toBe(HOST_GREEN);
    expect(computed(nest(LIGHT), '--opale-primary', HOST_ROOT)).toBe(HOST_GREEN);
  });

  it('garde les valeurs d’Opale sans surcharge', () => {
    expect(computed(nest(LIGHT), '--opale-primary', opaleSource)).toBe(OPALE_LIGHT_PRIMARY);
    expect(computed(nest(DARK), '--opale-primary', opaleSource)).toBe(OPALE_DARK_PRIMARY);
  });

  it('rétablit le clair d’Opale dans un gabarit clair posé sous une racine sombre', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    expect(computed(nest(), '--opale-primary', opaleSource)).toBe(OPALE_DARK_PRIMARY);
    expect(computed(nest(LIGHT), '--opale-primary', opaleSource)).toBe(OPALE_LIGHT_PRIMARY);
  });

  it('rétablit le clair dans un gabarit clair imbriqué dans un gabarit sombre', () => {
    expect(computed(nest(DARK, LIGHT), '--opale-primary', opaleSource)).toBe(OPALE_LIGHT_PRIMARY);
  });

  it('bascule en sombre dans un gabarit sombre, à toute profondeur', () => {
    expect(computed(nest(DARK), '--opale-primary', HOST_ROOT)).toBe(OPALE_DARK_PRIMARY);
    expect(computed(nest(LIGHT, DARK), '--opale-primary', opaleSource)).toBe(OPALE_DARK_PRIMARY);
    document.documentElement.setAttribute('data-theme', 'dark');
    expect(computed(nest(LIGHT, DARK), '--opale-primary', opaleSource)).toBe(OPALE_DARK_PRIMARY);
  });

  it('laisse la marque sombre de l’hôte traverser un gabarit sombre sous une racine sombre', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const css = withHost(`:root[data-theme='dark'] { --opale-primary: #00ff00; }`);
    expect(computed(nest(DARK), '--opale-primary', css)).toBe('#00ff00');
  });

  it('respecte encore la surcharge posée sur le sélecteur local, comme en 3.9.1', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const css = withHost(`[data-opale-page-theme='light'] { --opale-primary: ${HOST_GREEN}; }`);
    expect(computed(nest(LIGHT), '--opale-primary', css)).toBe(HOST_GREEN);
  });
});

/* ============================================================================
   `color-scheme` RESTE UN CHOIX, SAUF SUR LES SURFACES D'OPALE.

   Déclaré sur `:root[data-theme='dark']` (0,2,0), il l'emportait sur un
   `html { color-scheme: light }` d'hôte : un changement visible dans un
   correctif. La racine n'en pose donc aucun. Le schéma vit dans le jeton
   `--opale-color-scheme`, que lisent `.opale-root` (sur demande) et le
   gabarit lui-même — une surface d'Opale, qui le posait déjà.
   ========================================================================== */
describe('color-scheme', () => {
  it('n’est posé ni sur la racine claire ni sur la racine sombre', () => {
    expect(computed(nest(), 'color-scheme', opaleSource)).toBeUndefined();
    document.documentElement.setAttribute('data-theme', 'dark');
    expect(computed(nest(), 'color-scheme', opaleSource)).toBeUndefined();
    const css = withHost('html { color-scheme: light; }');
    expect(computed(nest(), 'color-scheme', css)).toBe('light');
  });

  it('suit le thème local sur le gabarit, par le jeton', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const light = nest(LIGHT).parentElement as Element;
    expect(computed(light, 'color-scheme', opaleSource)).toBe('var(--opale-color-scheme)');
    expect(resolved(light, 'color-scheme', opaleSource)).toBe('light');
    document.documentElement.removeAttribute('data-theme');
    const dark = nest(DARK).parentElement as Element;
    expect(resolved(dark, 'color-scheme', opaleSource)).toBe('dark');
    expect(resolved(nest(DARK, LIGHT).parentElement as Element, 'color-scheme', opaleSource)).toBe(
      'light',
    );
  });
});

/* ============================================================================
   LES JETONS DÉRIVÉS SE RECALCULENT SUR LE GABARIT.

   Un jeton écrit `var(--opale-primary)` ou `color-mix(… var(--opale-text) …)`
   se résout là où il est DÉCLARÉ, puis hérite de sa valeur résolue. Déclarés
   seulement sur `:root`, les dérivés ignoraient une surcharge posée sur
   `[data-opale-page-theme='light']` — ce qui marchait en 3.9.1, où tout le
   bloc y était redéclaré. Ils sont donc redits sur chaque thème local ; les
   jetons de base, eux, continuent d'hériter de l'hôte.
   ========================================================================== */
describe('les jetons dérivés', () => {
  const HOST_ATTRIBUTE = withHost(
    `[data-opale-page-theme='light'] { --opale-primary: ${HOST_GREEN}; --opale-radius-md: 4px; }`,
  );

  it('suivent une surcharge posée sur le thème local', () => {
    const leaf = nest(LIGHT);
    expect(resolved(leaf, '--opale-primary-on-surface', HOST_ATTRIBUTE)).toBe(HOST_GREEN);
    expect(resolved(leaf, '--opale-squircle-radius', HOST_ATTRIBUTE)).toBe('min(4px, 50%)');
  });

  it('suivent la marque de l’hôte posée sur :root, dans le gabarit', () => {
    expect(resolved(nest(LIGHT), '--opale-primary-on-surface', HOST_ROOT)).toBe(HOST_GREEN);
    expect(resolved(nest(LIGHT), '--opale-fill-danger', HOST_ROOT)).toBe(
      'color-mix(in srgb, #b3261e 80%, #14100b)',
    );
  });

  it('suivent une surcharge posée sur le thème local sombre', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const css = withHost(`[data-opale-page-theme='dark'] { --opale-primary-light: #00ff00; }`);
    expect(resolved(nest(DARK), '--opale-primary-on-surface', css)).toBe('#00ff00');
  });

  /* LA LISTE NE PEUT PAS DÉRIVER. Tout jeton d'un bloc racine qui cite un
     autre jeton doit être redit, à l'identique, sur le thème local. */
  const rules = postcss.parse(opaleSource.replace(/\/\*[\s\S]*?\*\//g, '')).nodes;
  const ruleFor = (predicate: (selectors: readonly string[]) => boolean) => {
    const found = rules.find(
      (node): node is postcss.Rule => node.type === 'rule' && predicate(node.selectors),
    );
    if (!found) throw new Error('règle absente');
    return found;
  };
  const derived = (rule: postcss.Rule) => {
    const map = new Map<string, string>();
    rule.each((child) => {
      if (child.type === 'decl' && child.prop.startsWith('--') && child.value.includes('var(--')) {
        map.set(child.prop, child.value.replace(/\s+/g, ' ').trim());
      }
    });
    return map;
  };
  const exact = (selector: string) => (selectors: readonly string[]) =>
    selectors.length === 1 && selectors[0] === selector;

  it.each([
    ['clair', ':root', "[data-opale-page-theme='light']"],
    ['sombre', ":root[data-theme='dark']", "[data-opale-page-theme='dark']"],
  ])('redit tous les dérivés du bloc %s sur le thème local', (_name, root, local) => {
    const source = derived(ruleFor((selectors) => selectors.includes(root)));
    const restated = derived(ruleFor(exact(local)));
    expect(source.size).toBeGreaterThan(5);
    expect(restated).toEqual(source);
  });
});

/* ============================================================================
   UNE FEUILLE CHARGÉE DANS UNE RACINE FANTÔME.

   `:root` n'y désigne rien. En 3.9.1, le gabarit portait tout le bloc par son
   attribut, et un PageScaffold isolé dans un Shadow DOM avait ses jetons.
   `:host` rejoint donc la racine claire et le contexte clair du sombre.
   ========================================================================== */
describe(':host', () => {
  const selectorsOf = (first: string) => {
    const rule = postcss
      .parse(opaleSource.replace(/\/\*[\s\S]*?\*\//g, ''))
      .nodes.find(
        (node): node is postcss.Rule => node.type === 'rule' && node.selectors[0] === first,
      );
    return rule?.selectors ?? [];
  };

  it('porte les jetons clairs', () => {
    expect(selectorsOf(':root')).toContain(':host');
  });

  it('compte comme contexte clair pour le gabarit sombre', () => {
    const dark = selectorsOf(":root[data-theme='dark']").map((one) => one.replace(/\s+/g, ' '));
    expect(dark).toContain(
      ":where(:root:not([data-theme='dark']), :host, [data-opale-page-theme='light']) [data-opale-page-theme='dark']",
    );
  });
});

/* ============================================================================
   `.opale-root` PEINT LA PAGE HÔTE, SUR DEMANDE.

   Opale ne touche ni `html` ni `body`, et c'est sain. Mais avec
   `data-theme="dark"`, une page qui ne peint rien gardait son fond blanc sous
   des encres claires : 43 échecs de contraste mesurés par axe (ACC-19). La
   classe est facultative et additive : qui ne la pose pas ne voit rien changer.
   ========================================================================== */
describe('.opale-root', () => {
  const rootRule = () => {
    const found = declarationsOf(opaleSource, 'background').find(
      (declaration) => declaration.selector === '.opale-root',
    );
    return found?.value;
  };

  it('peint le fond, l’encre, la police et le color-scheme depuis les jetons', () => {
    expect(rootRule()).toBe('var(--opale-background)');
    const body = document.body;
    body.className = 'opale-root';
    expect(computed(body, 'color', opaleSource)).toBe('var(--opale-text)');
    expect(computed(body, 'font-family', opaleSource)).toBe('var(--opale-font-body)');
    expect(computed(body, 'color-scheme', opaleSource)).toBe('var(--opale-color-scheme)');
    body.className = '';
  });

  it('nomme le color-scheme de chaque thème dans un jeton', () => {
    expect(computed(nest(), '--opale-color-scheme', opaleSource)).toBe('light');
    expect(computed(nest(DARK), '--opale-color-scheme', opaleSource)).toBe('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    expect(computed(nest(), '--opale-color-scheme', opaleSource)).toBe('dark');
    expect(computed(nest(LIGHT), '--opale-color-scheme', opaleSource)).toBe('light');
  });
});
