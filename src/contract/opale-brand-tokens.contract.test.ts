import postcss from 'postcss';
import { afterEach, describe, expect, it } from 'vitest';

import { contrastRatio, deltaEOklab } from './color';
import { declaration, declarations, stripComments } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   À LA MARQUE DE CHAQUE PROJET (3.9.4) — TROIS OUTILS, TOUS FACULTATIFS.

   1. UNE ENCRE PAR RÔLE. `--opale-on-primary`, `--opale-on-secondary` et
      `--opale-on-danger` valent `--opale-on-fill` : sans surcharge, rien ne
      bouge. Une marque claire (jaune, cyan) pose une encre sombre sur SON
      primaire sans rendre le bouton danger illisible (THM-06).

   2. `data-opale-brand="derive"`. Les états de la marque — survol, teinte,
      anneau, encre de surface — se calculent depuis `--opale-primary` (et le
      secondaire, le danger). Sans l'attribut, les valeurs écrites d'Opale
      restent en place, à l'octet près (THM-02).

   3. `data-opale-scope`. Les jetons dérivés sont redits sur le sous-arbre :
      une marque ou un rayon surchargé localement s'y propage (THM-03).

   CE TEST REJOUE LA CASCADE, comme `opale-page-theme.contract.test.ts` : jsdom
   n'hérite pas les propriétés personnalisées. Il prend les règles de premier
   niveau, les confronte à de vrais éléments par `Element.matches`, les
   départage par spécificité puis par ordre, et substitue chaque `var()` LÀ OÙ
   LA PROPRIÉTÉ EST DÉCLARÉE — c'est le piège que `data-opale-scope` corrige.
   ========================================================================== */

interface Declaration {
  readonly selector: string;
  readonly value: string;
  readonly specificity: readonly [number, number, number];
  readonly order: number;
}

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

/** Spécificité d'un sélecteur ; `:is`/`:not` prennent leur argument le plus lourd. */
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
      const heaviest = splitTopLevel(selector.slice(open + 1, close))
        .map(specificity)
        .sort((one, other) => one[0] - other[0] || one[1] - other[1] || one[2] - other[2])
        .at(-1) ?? [0, 0, 0];
      score[0] += heaviest[0];
      score[1] += heaviest[1];
      score[2] += heaviest[2];
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

function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < list.length; index += 1) {
    if (list[index] === '(') depth += 1;
    else if (list[index] === ')') depth -= 1;
    else if (list[index] === ',' && depth === 0) {
      parts.push(list.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(list.slice(start).trim());
  return parts;
}

const parsed = new Map<string, postcss.Root>();
function tree(css: string): postcss.Root {
  let root = parsed.get(css);
  if (!root) {
    root = postcss.parse(stripComments(css));
    parsed.set(css, root);
  }
  return root;
}

function declarationsOf(css: string, property: string): readonly Declaration[] {
  const found: Declaration[] = [];
  let order = 0;
  tree(css).each((node) => {
    if (node.type !== 'rule') return;
    node.each((child) => {
      if (child.type !== 'decl') return;
      for (const selector of node.selectors) {
        order += 1;
        if (child.prop !== property) continue;
        found.push({
          selector: selector.replace(/\s+/g, ' ').trim(),
          value: child.value.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim(),
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

/** `:host` ne correspond à rien hors d'une racine fantôme — jsdom refuse parfois de le lire. */
function matches(element: Element, selector: string): boolean {
  if (/^:host/.test(selector)) return false;
  return element.matches(selector.replace(/,\s*:host(\([^)]*\))?/g, ''));
}

function winning(
  element: Element,
  property: string,
  css: string,
): { value: string; owner: Element } | undefined {
  const winner = declarationsOf(css, property)
    .filter((candidate) => matches(element, candidate.selector))
    .sort(compare)
    .at(-1);
  if (winner) return { value: winner.value, owner: element };
  return element.parentElement ? winning(element.parentElement, property, css) : undefined;
}

/** La valeur calculée, `var()` substitués là où la propriété est déclarée. */
function resolved(element: Element, property: string, css: string): string | undefined {
  const found = winning(element, property, css);
  if (!found) return undefined;
  /* `inherit` rend la valeur calculée du parent — c'est ce que la portée sombre
     pose sur les encres de signal écrites en dur. */
  if (found.value === 'inherit') {
    const parent = found.owner.parentElement;
    return parent ? resolved(parent, property, css) : undefined;
  }
  return found.value.replace(
    /var\((--[\w-]+)\)/g,
    (_match, name: string) => resolved(found.owner, name, css) ?? `var(${name})`,
  );
}

/* ----------------------------------------------------------------------------
   Un `color-mix()` calculé comme CSS Color 5 le prescrit, en srgb ou en oklab.
   `color.ts` ne résout que srgb ; la dérivation mélange en oklab, où un
   assombrissement garde sa teinte.
   ------------------------------------------------------------------------- */
type Rgb = readonly [number, number, number];
const KEYWORDS: Record<string, string> = { black: '#000000', white: '#ffffff' };

function hexToRgb(hex: string): Rgb {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex;
  return [1, 3, 5].map((at) => Number.parseInt(full.slice(at, at + 2), 16) / 255) as unknown as Rgb;
}
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToOklab([r, g, b]: Rgb): Rgb {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, toGamma(c)))) as unknown as Rgb;
}

function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Une couleur écrite — hexadécimal, `black`/`white`, ou `color-mix()` imbriqué. */
function paint(value: string): string {
  const text = value.trim();
  if (KEYWORDS[text]) return KEYWORDS[text];
  if (/^#[0-9a-f]{3,6}$/i.test(text)) return text.toLowerCase();
  const mix = /^color-mix\(\s*in (srgb|oklab)\s*,(.*)\)$/i.exec(text);
  if (!mix) throw new Error(`couleur non résolue : « ${text} »`);
  const [first, second] = splitTopLevel(mix[2]).map((part) => {
    const weight = /\s(\d+(?:\.\d+)?)%$/.exec(part);
    return {
      color: paint(weight ? part.slice(0, weight.index) : part),
      weight: weight ? Number(weight[1]) / 100 : undefined,
    };
  });
  const p1 = first.weight ?? 1 - (second.weight ?? 0.5);
  const p2 = second.weight ?? 1 - p1;
  const space = mix[1].toLowerCase();
  const into = (hex: string) => (space === 'oklab' ? rgbToOklab(hexToRgb(hex)) : hexToRgb(hex));
  const one = into(first.color);
  const other = into(second.color);
  const blended = [0, 1, 2].map(
    (axis) => (one[axis] * p1 + other[axis] * p2) / (p1 + p2),
  ) as unknown as Rgb;
  return toHex(space === 'oklab' ? oklabToRgb(blended) : blended);
}

/* ----------------------------------------------------------------------------
   Des pages de test.
   ------------------------------------------------------------------------- */
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

const HOST_GREEN = '#16a34a';
const LIGHT = { 'data-opale-page-theme': 'light' };
const DARK = { 'data-opale-page-theme': 'dark' };
const SCOPE = { 'data-opale-scope': '', class: 'brand' };
const DERIVE = { 'data-opale-brand': 'derive', class: 'brand' };

const withHost = (host: string) => `${opaleSource}\n${host}`;
/** L'hôte surcharge sa marque sur un conteneur, pas sur `:root`. */
const LOCAL_BRAND = withHost(`.brand { --opale-primary: ${HOST_GREEN}; --opale-radius-md: 4px; }`);

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-opale-brand');
});

const root = declarations(opaleSource, ':root');
const darkRoot = declarations(opaleSource, ":root[data-theme='dark']");

/* ============================================================================
   1. UNE ENCRE PAR RÔLE.
   ========================================================================== */
describe('les encres de rôle', () => {
  const ROLE_INKS = ['--opale-on-primary', '--opale-on-secondary', '--opale-on-danger'];

  it.each(ROLE_INKS)('%s vaut l’encre des remplissages dans chaque bloc de thème', (ink) => {
    for (const selector of [
      ':root',
      ":root[data-theme='dark']",
      "[data-opale-page-theme='light']",
      "[data-opale-page-theme='dark']",
    ]) {
      expect(declarations(opaleSource, selector).get(ink), `${ink} sur ${selector}`).toBe(
        'var(--opale-on-fill)',
      );
    }
  });

  it('garde l’encre d’accent à part, et à sa valeur', () => {
    expect(root.get('--opale-on-accent')).toBe('#241a03');
  });

  it.each([
    ['.opale-button', 'var(--opale-on-primary)'],
    ['.opale-button--secondary', 'var(--opale-on-secondary)'],
    ['.opale-button--danger', 'var(--opale-on-danger)'],
    ['.opale-button--accent', 'var(--opale-on-accent)'],
    ['.opale-checkbox:checked + .opale-checkbox-mark', 'var(--opale-on-primary)'],
    ['.opale-checkbox:indeterminate + .opale-checkbox-mark', 'var(--opale-on-primary)'],
    ['.opale-file-card--selected::after', 'var(--opale-on-primary)'],
    [".opale-pagination button[aria-current='page']", 'var(--opale-on-primary)'],
    [
      "[data-opale-glass-ink='page'] .opale-button--glass.opale-button--primary",
      'var(--opale-on-primary)',
    ],
    [
      "[data-opale-glass-ink='page'] .opale-button--glass.opale-button--secondary",
      'var(--opale-on-secondary)',
    ],
    [
      "[data-opale-glass-ink='page'] .opale-button--glass.opale-button--danger",
      'var(--opale-on-danger)',
    ],
    ["[data-opale-glass-ink='page'] .opale-badge--glass", 'var(--opale-on-primary)'],
    [
      "[data-opale-glass-ink='page'] .opale-badge--glass.opale-badge--danger",
      'var(--opale-on-danger)',
    ],
    [
      "[data-opale-glass-ink='page'] .opale-checkbox:checked + .opale-checkbox-mark",
      'var(--opale-on-primary)',
    ],
  ])('%s écrit à l’encre de son aplat', (selector, ink) => {
    expect(declaration(opaleSource, selector, 'color')).toBe(ink);
  });

  it('coche la liste multiple à l’encre du primaire', () => {
    const mark = declarations(opaleSource, '.opale-multiselect__mark::after');
    expect(mark.get('border-left')).toBe('2px solid var(--opale-on-primary)');
    expect(mark.get('border-bottom')).toBe('2px solid var(--opale-on-primary)');
  });

  /* PLUS AUCUN APLAT DE MARQUE NE LIT L'ENCRE COMMUNE EN DIRECT. Seuls les
     toasts la gardent : leurs aplats sont des TONS (succès, alerte, erreur,
     info), pas des rôles de marque, et `--opale-fill-*` est réglé pour elle.
     Les pastilles de ton d'`OpaleTone` (3.10, DX-10) sont le même cas : un
     aplat `--opale-fill-*` — ou l'encre secondaire pour `neutral` — sous
     l'encre commune, mesuré par `opale-badge-tones.contract.test.ts`. */
  it('ne laisse lire `--opale-on-fill` qu’aux jetons de rôle et aux tons des toasts', () => {
    const readers: string[] = [];
    tree(opaleSource).walkDecls((decl) => {
      if (!decl.value.includes('var(--opale-on-fill)')) return;
      if (/^--opale-on-(primary|secondary|danger)$/.test(decl.prop)) return;
      const rule = decl.parent as postcss.Rule;
      for (const selector of rule.selectors) {
        const trimmed = selector.trim();
        const toneFill =
          /^\.opale-toast--(success|warning|error|info)$/.test(trimmed) ||
          /^(:is\(\[data-opale-glass\] \.opale-badge, \.opale-badge--glass\))?\.opale-badge--(success|warning|info|neutral)$/.test(
            trimmed,
          );
        if (!toneFill) {
          readers.push(`${trimmed} { ${decl.prop} }`);
        }
      }
    });
    expect(readers).toEqual([]);
  });

  it('pose une encre de rôle sur chaque règle qui peint un aplat de marque ET une encre', () => {
    const FILL = /^var\(--opale-(primary|secondary|secondary-dark|danger)\)$/;
    const INK = {
      primary: 'primary',
      secondary: 'secondary',
      'secondary-dark': 'secondary',
      danger: 'danger',
    };
    const offenders: string[] = [];
    tree(opaleSource).walkRules((rule) => {
      const own = new Map<string, string>();
      rule.each((child) => {
        if (child.type === 'decl') own.set(child.prop, child.value.trim());
      });
      const fill = own.get('background') ?? own.get('--opale-button-background');
      const ink = own.get('color');
      const match = fill ? FILL.exec(fill) : null;
      if (!match || ink === undefined) return;
      const role = INK[match[1] as keyof typeof INK];
      if (ink !== `var(--opale-on-${role})`) offenders.push(`${rule.selector}: ${ink}`);
    });
    expect(offenders).toEqual([]);
  });

  it('suit une encre de rôle posée sur un sous-arbre', () => {
    const css = withHost(`.brand { --opale-on-primary: #14100b; }`);
    expect(resolved(nest({ class: 'brand' }), '--opale-on-primary', css)).toBe('#14100b');
    expect(resolved(nest({ class: 'brand' }), '--opale-on-danger', css)).toBe('#fbfaf9');
  });
});

/* ============================================================================
   2. `data-opale-brand="derive"`.
   ========================================================================== */
describe('la dérivation de la marque', () => {
  const DERIVED = [
    '--opale-primary-dark',
    '--opale-primary-light',
    '--opale-secondary-dark',
    '--opale-danger-on-surface',
    '--opale-focus',
  ];

  it('ne touche rien sans l’attribut : les valeurs écrites restent', () => {
    expect(root.get('--opale-primary-dark')).toBe('#23457a');
    expect(root.get('--opale-primary-light')).toBe('#5f87c4');
    expect(root.get('--opale-secondary-dark')).toBe('#3a6b8a');
    expect(root.get('--opale-focus')).toBe('#315c9e');
    expect(darkRoot.get('--opale-primary-dark')).toBe('#739cda');
    expect(darkRoot.get('--opale-primary-light')).toBe('#a9c7f4');
    expect(darkRoot.get('--opale-focus')).toBe('#a9c7f4');
    expect(darkRoot.get('--opale-danger-on-surface')).toBe('#f09a94');
    for (const token of DERIVED) {
      expect(resolved(nest(), token, withHost(`:root { --opale-primary: ${HOST_GREEN}; }`))).toBe(
        token === '--opale-danger-on-surface' ? '#b3261e' : root.get(token),
      );
    }
  });

  it('déclare la recette de dérivation dans les deux thèmes, sans `var()`', () => {
    for (const block of [root, darkRoot]) {
      for (const name of [
        '--opale-brand-mix-hover',
        '--opale-brand-mix-light',
        '--opale-brand-mix-secondary',
        '--opale-brand-mix-danger-ink',
      ]) {
        expect(block.get(name), name).toMatch(/^\d+%$/);
      }
    }
  });

  /* LA MARQUE D'OPALE, DÉRIVÉE, RETOMBE SUR SES PROPRES VALEURS. Les recettes
     ont été ajustées pour que l'écart reste sous 2 (ΔE OKLab ×100) : sous le
     seuil où deux aplats voisins se distinguent. */
  it.each([
    ['clair', undefined],
    ['sombre', 'dark'],
  ])('retombe sur les valeurs d’Opale en thème %s', (_name, theme) => {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-opale-brand', 'derive');
    const leaf = nest();
    const written = theme ? darkRoot : root;
    for (const token of DERIVED) {
      const derived = paint(resolved(leaf, token, opaleSource) ?? '');
      const expected =
        written.get(token)?.startsWith('var(') || written.get(token) === undefined
          ? paint(resolved(leaf, '--opale-danger', opaleSource) ?? '')
          : (written.get(token) as string);
      expect(
        deltaEOklab(derived, expected),
        `${token} : ${derived} contre ${expected}`,
      ).toBeLessThan(2);
    }
  });

  it('fait suivre survol, teinte et anneau à une marque posée sur :root', () => {
    document.documentElement.setAttribute('data-opale-brand', 'derive');
    const css = withHost(`:root { --opale-primary: ${HOST_GREEN}; }`);
    const leaf = nest();
    expect(resolved(leaf, '--opale-primary-dark', css)).toBe(
      `color-mix(in oklab, ${HOST_GREEN} 74%, #14100b)`,
    );
    expect(resolved(leaf, '--opale-primary-light', css)).toBe(
      `color-mix(in oklab, ${HOST_GREEN} 74%, white)`,
    );
    expect(resolved(leaf, '--opale-focus', css)).toBe(HOST_GREEN);
    expect(resolved(leaf, '--opale-primary-on-surface', css)).toBe(HOST_GREEN);
  });

  it('éclaircit au lieu d’assombrir en thème sombre', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-opale-brand', 'derive');
    const css = withHost(`:root[data-theme='dark'] { --opale-primary: ${HOST_GREEN}; }`);
    const leaf = nest();
    const hover = paint(resolved(leaf, '--opale-primary-dark', css) ?? '');
    const light = paint(resolved(leaf, '--opale-primary-light', css) ?? '');
    expect(contrastRatio(hover, '#0c0f0d')).toBeGreaterThan(contrastRatio(HOST_GREEN, '#0c0f0d'));
    expect(resolved(leaf, '--opale-focus', css)).toBe(resolved(leaf, '--opale-primary-light', css));
    /* L'encre de surface du sombre est le primaire clair : il doit se lire. */
    expect(contrastRatio(light, '#262c27')).toBeGreaterThanOrEqual(4.5);
  });

  it('dérive sur un sous-arbre, à partir de la marque posée sur ce sous-arbre', () => {
    const leaf = nest(DERIVE);
    expect(resolved(leaf, '--opale-primary-dark', LOCAL_BRAND)).toBe(
      `color-mix(in oklab, ${HOST_GREEN} 74%, #14100b)`,
    );
    expect(resolved(leaf, '--opale-primary-on-surface', LOCAL_BRAND)).toBe(HOST_GREEN);
    expect(resolved(leaf, '--opale-focus', LOCAL_BRAND)).toBe(HOST_GREEN);
  });

  it('dérive en sombre sur un sous-arbre d’une racine sombre', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const leaf = nest(DERIVE);
    expect(resolved(leaf, '--opale-primary-dark', LOCAL_BRAND)).toBe(
      `color-mix(in oklab, ${HOST_GREEN} 82%, #f3f1ec)`,
    );
    expect(resolved(leaf, '--opale-primary-on-surface', LOCAL_BRAND)).toBe(
      `color-mix(in oklab, ${HOST_GREEN} 48%, white)`,
    );
  });

  it('redérive dans un gabarit sombre posé sous une marque dérivée claire', () => {
    const leaf = nest(DERIVE, DARK);
    /* Le gabarit rétablit le primaire sombre d'Opale ; la dérivation suit SON
       thème, pas celui du conteneur. */
    expect(resolved(leaf, '--opale-primary-dark', LOCAL_BRAND)).toBe(
      'color-mix(in oklab, #5d87cb 82%, #f3f1ec)',
    );
  });
});

/* ============================================================================
   3. `data-opale-scope`.
   ========================================================================== */
describe('la portée locale', () => {
  it('sans l’attribut, garde le piège documenté : le dérivé reste celui de la racine', () => {
    expect(resolved(nest({ class: 'brand' }), '--opale-primary-on-surface', LOCAL_BRAND)).toBe(
      '#315c9e',
    );
  });

  it('propage une marque et un rayon posés sur le sous-arbre', () => {
    const leaf = nest(SCOPE);
    expect(resolved(leaf, '--opale-primary-on-surface', LOCAL_BRAND)).toBe(HOST_GREEN);
    expect(resolved(leaf, '--opale-squircle-radius', LOCAL_BRAND)).toBe('min(4px, 50%)');
    expect(resolved(leaf, '--opale-squircle-clip', LOCAL_BRAND)).toContain('calc(min(4px, 50%)');
  });

  it('suit le thème sombre de la racine, sans écraser ses encres écrites', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const leaf = nest(SCOPE);
    const css = withHost(`.brand { --opale-primary-light: #00ff00; }`);
    expect(resolved(leaf, '--opale-primary-on-surface', css)).toBe('#00ff00');
    expect(resolved(leaf, '--opale-success-on-surface', css)).toBe('#7bd18a');
    expect(resolved(leaf, '--opale-fill-danger', css)).toBe('#f09a94');
  });

  it.each([
    ['un gabarit clair sous une racine sombre', 'dark', [LIGHT, SCOPE], 'light'],
    ['un gabarit sombre sous une racine claire', undefined, [DARK, SCOPE], 'dark'],
    ['un gabarit clair dans un gabarit sombre', undefined, [DARK, LIGHT, SCOPE], 'light'],
    ['un gabarit sombre dans un gabarit clair', 'dark', [LIGHT, DARK, SCOPE], 'dark'],
  ] as const)(
    'prend le thème du plus proche gabarit : %s',
    (_name, rootTheme, layers, expected) => {
      if (rootTheme) document.documentElement.setAttribute('data-theme', rootTheme);
      const css = withHost(
        `.brand { --opale-primary: ${HOST_GREEN}; --opale-primary-light: #00ff00; }`,
      );
      const leaf = nest(...layers);
      expect(resolved(leaf, '--opale-primary-on-surface', css)).toBe(
        expected === 'light' ? HOST_GREEN : '#00ff00',
      );
    },
  );

  it('laisse un gabarit porteur de l’attribut suivre son propre thème', () => {
    const leaf = nest({ ...DARK, 'data-opale-scope': '' });
    expect(resolved(leaf, '--opale-primary-on-surface', opaleSource)).toBe('#a9c7f4');
  });

  /* LA LISTE NE PEUT PAS DÉRIVER. Tout jeton d'un bloc racine qui cite un autre
     jeton est redit, à l'identique, sur la portée du même thème. */
  const derivedOf = (selector: string) => {
    const map = new Map<string, string>();
    for (const [name, value] of declarations(opaleSource, selector)) {
      if (name.startsWith('--') && value.includes('var(--')) map.set(name, value);
    }
    return map;
  };
  const scoped = (element: Element) => {
    const map = new Map<string, string>();
    for (const name of derivedOf(':root').keys()) {
      const found = winning(element, name, opaleSource);
      if (found?.owner === element) map.set(name, found.value);
    }
    return map;
  };
  const normalised = (map: Map<string, string>) =>
    new Map(
      [...map].map(([name, value]) => [
        name,
        value.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim(),
      ]),
    );

  it('redit tous les dérivés du clair sur une portée claire', () => {
    const source = normalised(derivedOf(':root'));
    expect(source.size).toBeGreaterThan(5);
    expect(scoped(nest(SCOPE).parentElement as Element)).toEqual(source);
  });

  it('redit tous les dérivés du sombre sur une portée sombre', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const source = normalised(derivedOf(":root[data-theme='dark']"));
    const element = nest(SCOPE).parentElement as Element;
    const restated = new Map([...scoped(element)].filter(([name]) => source.has(name)));
    expect(restated).toEqual(source);
    /* Les jetons dérivés en clair mais ÉCRITS en sombre ne sont pas recalculés :
       la portée les laisse hériter du thème, ou de la surcharge de l'hôte. */
    for (const name of [
      '--opale-success-on-surface',
      '--opale-info-on-surface',
      '--opale-danger-on-surface',
    ]) {
      expect(scoped(element).get(name), name).toBe('inherit');
    }
  });
});
