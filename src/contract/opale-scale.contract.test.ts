import postcss, { AtRule, Rule } from 'postcss';
import { describe, expect, it } from 'vitest';

import { declaration, declarations, parseRules, stripComments } from '../test/css-rules';
import fontsSource from '../opale/fonts.css?raw';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   L'ÉCHELLE D'OPALE, SANS EXCEPTION CACHÉE (2.9.4).

   Chaque réglage qu'un hôte surcharge doit atteindre toutes les pièces qu'il
   décrit. Quatre fuites relevées par l'audit de personnalisation :

   - THM-12 : trois rayons écrits en dur. Rayons à 0, la case à cocher gardait
     6 px d'arrondi au milieu d'une interface carrée.
   - THM-20 : 37 espacements en `rem` littéraux. Resserrer `--opale-space-*`
     ne resserrait ni les boutons, ni les pastilles, ni les segments.
   - THM-13 / THM-14 : un anneau de focus rectangulaire autour d'un bouton
     arrondi, et le contour du bouton ghost coupé en quatre fragments.
   - THM-09 : la règle de mouvement réduit visait `*`, donc toute la page hôte.

   Plus THM-16 : des faces de repli aux métriques de Chivo et de Bricolage, pour
   que le texte ne saute pas quand la police arrive.

   RIEN NE BOUGE SANS SURCHARGE : chaque littéral devient un jeton de même
   valeur, ou un calcul qui retombe exactement sur l'ancienne longueur.
   ========================================================================== */

const ast = postcss.parse(stripComments(opaleSource));
const root = declarations(opaleSource, ':root');
const PX_PER_REM = 16;

/** Une longueur écrite en `rem` ou `px`, en pixels. */
function px(length: string): number {
  const value = Number.parseFloat(length);
  return length.trim().endsWith('rem') ? value * PX_PER_REM : value;
}

/** Évalue `var(--x)`, `calc(a / b)` et `calc(a * b)` sur les jetons de `:root`. */
function evaluate(expression: string): number {
  const substituted = expression.replace(/var\((--[\w-]+)\)/g, (_m, name: string) => {
    const value = root.get(name);
    if (value === undefined) throw new Error(`jeton ${name} absent de :root`);
    return `${px(value)}`;
  });
  const calc = /^calc\((.*)\)$/.exec(substituted.trim());
  const body = (calc ? calc[1] : substituted).replace(
    /(-?\d*\.?\d+)(rem|px)/g,
    (_m, n, unit) => `${unit === 'rem' ? Number(n) * PX_PER_REM : Number(n)}`,
  );
  return arithmetic(body);
}

/** Les quatre opérations et les parenthèses, rien de plus : ce qu'écrit un `calc()` d'Opale. */
function arithmetic(text: string): number {
  const tokens = text.match(/\d*\.?\d+|[-+*/()]/g) ?? [];
  if (tokens.join('') !== text.replace(/\s+/g, ''))
    throw new Error(`expression non évaluable : ${text}`);
  let at = 0;
  const factor = (): number => {
    const token = tokens[at++];
    if (token === '-') return -factor();
    if (token === '(') {
      const value = sum();
      at += 1;
      return value;
    }
    return Number(token);
  };
  const product = (): number => {
    let value = factor();
    while (tokens[at] === '*' || tokens[at] === '/') {
      const operator = tokens[at++];
      const right = factor();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (tokens[at] === '+' || tokens[at] === '-') {
      const operator = tokens[at++];
      const right = product();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };
  return sum();
}

/** Les composantes d'une valeur, séparées par les espaces hors parenthèses. */
function splitSpaces(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value.trim()) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (/\s/.test(char) && depth === 0) {
      if (current) parts.push(current);
      current = '';
    } else current += char;
  }
  if (current) parts.push(current);
  return parts;
}

/* ============================================================================
   THM-12 — LES RAYONS.
   ========================================================================== */
describe('les rayons', () => {
  const ALLOWED = /^(0|50%|inherit|var\(--opale-(radius|squircle)-[\w-]+\))$/;
  /* Un rayon peut aussi se DÉDUIRE de l'échelle : `calc(var(--opale-radius-sm) / 2)`
     suit une surcharge de `--opale-radius-sm`, et retombe sur 6 px par défaut. */
  const DERIVED = /^calc\(var\(--opale-(radius|squircle)-[\w-]+\)( [*/] [\d.]+)+\)$/;
  /* La tache organique du fond de page est une forme, pas un arrondi. Le rayon
     d'enveloppe du bouton de verre (15 px) est CALCULÉ contre le squircle de
     22 px — voir son commentaire —, et la vitrine le recopie à l'identique
     (`doc-verre-liquide.structure.test.ts`) : il reste écrit. */
  const SHAPES = new Set(['42% 58% 65% 35%', '0.9375rem']);

  it('n’écrit aucun rayon hors de l’échelle', () => {
    const offenders: string[] = [];
    ast.walkDecls(/(^border(-[\w-]+)?-radius$|^--opale-glass-radius$)/, (decl) => {
      if (decl.parent instanceof Rule && decl.parent.selector === ':root') return;
      const value = decl.value.trim();
      if (SHAPES.has(value)) return;
      /* Un rayon par coin (`var(--opale-radius-lg) 0 0 var(--opale-radius-lg)`)
         se juge coin par coin. */
      const corners = splitSpaces(value);
      if (corners.every((corner) => ALLOWED.test(corner) || DERIVED.test(corner))) return;
      offenders.push(`${(decl.parent as Rule).selector}: ${decl.prop}: ${value}`);
    });
    expect(offenders).toEqual([]);
  });

  it.each([
    ['.opale-checkbox-mark', 'border-radius', 6],
    ['.opale-multiselect__mark', 'border-radius', 6],
    ['.opale-checkbox--glass-root', '--opale-glass-radius', 6],
    ['.opale-toast__close::before', 'border-radius', 8],
  ])('%s garde son arrondi par défaut (%s = %i px)', (selector, property, expected) => {
    const value = declaration(opaleSource, selector, property);
    expect(value, `${selector} ${property}`).toBeDefined();
    expect(evaluate(value ?? '')).toBeCloseTo(expected, 6);
  });

  it('arrondit la pastille de chargement par la pilule', () => {
    expect(declaration(opaleSource, '.opale-skeleton--rounded', 'border-radius')).toBe(
      'var(--opale-radius-pill)',
    );
  });
});

/* ============================================================================
   THM-20 — LES ESPACEMENTS.
   ========================================================================== */
describe('les espacements', () => {
  const SPACING = /^(padding|margin|gap|row-gap|column-gap)(-|$)/;
  const LENGTH = /(?<![\w.-])(-?\d*\.?\d+)(rem|px|em)\b/g;
  /* TROIS LITTÉRAUX RESTENT, ET CE NE SONT PAS DES ESPACEMENTS MAIS DE LA
     GÉOMÉTRIE. La poignée de l'interrupteur est centrée dans sa piste
     ((1,75 − 1,25) / 2 = 0,25 rem) ; le retrait de la tuile d'icône d'un
     fichier la porte à 2,75 rem ; la coche de la liste multiple est remontée
     vers le centre visuel de sa case. Les lier à la densité les décentrerait.
     L'interrupteur `small` (3.10, DX-11) suit la même règle :
     (1,375 − 1) / 2 = 0,1875 rem. */
  const GEOMETRY = new Set([
    '.opale-toggle-thumb|margin-inline-start',
    '.opale-toggle-row--small .opale-toggle-thumb|margin-inline-start',
    '.opale-file-card__icon|padding',
    '.opale-multiselect__mark::after|margin-block-start',
  ]);

  it('ne pose padding, marge ni gouttière qu’à partir d’un jeton', () => {
    expect([...root.keys()].filter((name) => name.startsWith('--opale-space-'))).toEqual([
      '--opale-space-2xs',
      '--opale-space-xs',
      '--opale-space-sm',
      '--opale-space-md',
      '--opale-space-lg',
      '--opale-space-xl',
      '--opale-space-2xl',
    ]);
    const offenders: string[] = [];
    ast.walkDecls((decl) => {
      if (!SPACING.test(decl.prop)) return;
      const selector = (decl.parent as Rule).selector?.replace(/\s+/g, ' ');
      if (GEOMETRY.has(`${selector}|${decl.prop}`)) return;
      for (const [, amount, unit] of decl.value.matchAll(LENGTH)) {
        if (Number(amount) === 0 || (unit === 'px' && Math.abs(Number(amount)) === 1)) continue;
        offenders.push(`${selector}: ${decl.prop}: ${decl.value}`);
        break;
      }
    });
    expect(offenders).toEqual([]);
  });

  /* LES JETONS NOUVEAUX PORTENT LES VALEURS D'AVANT, À L'OCTET PRÈS. Ils ne
     s'appellent pas `--opale-space-*` : ce préfixe est l'ÉCHELLE (2xs → 2xl),
     que `opale-spacing.contract.test.ts` lit comme telle ; ceux-ci sont des
     réglages de composant. */
  it.each([
    ['--opale-button-padding-block', '0.375rem'],
    ['--opale-button-padding-inline', '1.25rem'],
    ['--opale-button-padding-inline-sm', '0.875rem'],
    ['--opale-button-padding-inline-lg', '1.625rem'],
    ['--opale-badge-gap', '0.35rem'],
    ['--opale-badge-padding-inline', '0.65rem'],
    ['--opale-stat-card-gap', '0.35rem'],
    ['--opale-item-padding-inline', '0.875rem'],
    ['--opale-nav-item-padding-block', '0.7rem'],
    ['--opale-stack-gap', '0.15rem'],
    ['--opale-cluster-gap', '0.375rem'],
    ['--opale-table-count-padding-inline', '0.625rem'],
    ['--opale-table-state-padding-block', '2rem'],
    ['--opale-description-row-gap', '0.65rem'],
    ['--opale-list-indent', '1.25rem'],
    ['--opale-command-option-gap', '0.125rem'],
    ['--opale-toast-padding-block', '0.625rem'],
  ])('%s vaut %s', (name, value) => {
    expect(root.get(name)).toBe(value);
  });

  it.each([
    ['.opale-button', 'padding', [6, 20]],
    ['.opale-button--small', 'padding', [4, 14]],
    ['.opale-button--large', 'padding', [8, 26]],
    ['.opale-segmented__item', 'padding', [8, 14]],
    ['.opale-nav__item', 'padding', [11.2, 14]],
    ['.opale-table td', 'padding', [12, 14]],
    ['.opale-table__sort', 'margin', [-4, -8]],
    ['.opale-toast', 'padding', [10, 12, 10, 16]],
    ['.opale-toast__close', 'margin', [-8, -8, -8, 0]],
  ] as const)('%s garde son %s par défaut', (selector, property, expected) => {
    const value = declaration(opaleSource, selector, property) ?? '';
    const parts = splitSpaces(value);
    expect(parts.map((part) => (part === '0' ? 0 : evaluate(part)))).toEqual(
      expected.map((one) => expect.closeTo(one, 6)),
    );
  });
});

/* ============================================================================
   THM-13 — L'ANNEAU ÉPOUSE LE BOUTON.
   ========================================================================== */
describe('l’anneau de focus du bouton', () => {
  it('arrondit la boîte du bouton au focus, à la courbure du squircle', () => {
    /* La boîte reste un rectangle au repos (le squircle est peint par
       `::before`) ; au focus, l'`outline` suit `border-radius`. 0,68 r est le
       rayon d'un arc qui passe par le même point diagonal que le squircle — le
       réglage que la vitrine applique déjà à ses propres contrôles. */
    expect(declaration(opaleSource, '.opale-button', 'border-radius')).toBe('0');
    expect(declaration(opaleSource, '.opale-button:focus-visible', 'border-radius')).toBe(
      'calc(var(--opale-squircle-radius) * 0.68)',
    );
  });

  it('garde la couleur, la largeur et le décalage communs', () => {
    const ring = declarations(opaleSource, '.opale-button:focus-visible');
    expect(ring.get('outline')).toBe('var(--opale-focus-ring-width) solid var(--opale-focus)');
    expect(ring.get('outline-offset')).toBe('var(--opale-focus-ring-offset)');
  });
});

/* ============================================================================
   THM-14 — LE CONTOUR DU BOUTON GHOST EST CONTINU.
   ========================================================================== */
describe('le contour du bouton ghost', () => {
  const ghost = declarations(opaleSource, '.opale-button--ghost::after');

  it('ne découpe plus un cadre rectangulaire par le squircle', () => {
    /* Le masque xor dessinait un cadre RECTANGULAIRE d'un pixel, que le
       `clip-path` du squircle rognait ensuite : aux angles, le cadre passait
       hors de la forme et disparaissait — quatre fragments disjoints. */
    for (const property of ['-webkit-mask', 'mask', 'mask-composite', '-webkit-mask-composite']) {
      expect(ghost.has(property), property).toBe(false);
    }
    expect(ghost.get('padding')).toBeUndefined();
  });

  it('trace un trait continu d’un pixel qui suit la courbure du squircle', () => {
    /* Sans découpage : un `clip-path` rognerait le trait, et deviendrait `none`
       — donc un aplat plein — si le rayon d'un hôte était invalide. */
    expect(ghost.has('clip-path')).toBe(false);
    expect(ghost.get('background')).toBeUndefined();
    expect(ghost.get('border')).toBe('1px solid var(--opale-primary)');
    expect(ghost.get('border-radius')).toBe(
      declaration(opaleSource, '.opale-button:focus-visible', 'border-radius'),
    );
  });
});

/* ============================================================================
   THM-09 — LE MOUVEMENT RÉDUIT RESTE CHEZ OPALE.
   ========================================================================== */
describe('le mouvement réduit', () => {
  const reduced = () => {
    const blocks: Rule[] = [];
    ast.walkAtRules('media', (media: AtRule) => {
      if (!/prefers-reduced-motion:\s*reduce/.test(media.params)) return;
      media.each((node) => {
        if (node instanceof Rule && node.some((d) => d.type === 'decl' && d.important === true)) {
          blocks.push(node);
        }
      });
    });
    return blocks;
  };

  it('ne vise plus `*` : la page hôte garde ses animations', () => {
    const selectors = reduced().flatMap((rule) => rule.selectors);
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector.trim(), selector).not.toMatch(/^\*(::?(before|after))?$/);
      expect(selector).toMatch(/\[class\^='opale-'\]/);
    }
  });

  it('couvre les éléments d’Opale, leurs descendants et leurs pseudo-éléments', () => {
    const selectors = reduced().flatMap((rule) =>
      rule.selectors.map((s) => s.replace(/\s+/g, ' ')),
    );
    const OWN = ":where([class^='opale-'], [class*=' opale-'])";
    expect(selectors).toEqual(
      expect.arrayContaining([
        OWN,
        `${OWN} *`,
        `${OWN}::before`,
        `${OWN}::after`,
        `${OWN} *::before`,
        `${OWN} *::after`,
      ]),
    );
    const body = declarations(`.x { ${reduced()[0]?.nodes.map(String).join('; ')} }`, '.x');
    expect(body.get('animation-duration')).toBe('0.01ms !important');
    expect(body.get('animation-iteration-count')).toBe('1 !important');
    expect(body.get('transition-duration')).toBe('0.01ms !important');
    expect(body.get('scroll-behavior')).toBe('auto !important');
  });
});

/* ============================================================================
   THM-16 — DES FACES DE REPLI AUX MÉTRIQUES DES POLICES D'OPALE.
   ========================================================================== */
describe('les polices de repli', () => {
  const faces = parseRules(fontsSource)
    .filter((rule) => rule.prelude === '@font-face')
    .map((rule) => declarations(`.face { ${rule.body} }`, '.face'));
  const face = (family: string, weight = '400 500') =>
    faces.find(
      (one) => one.get('font-family') === `'${family}'` && one.get('font-weight') === weight,
    );

  it.each([
    ['Chivo Fallback', '400 500', 'Arial', '106.16%', '88.55%', '23.55%'],
    ['Chivo Fallback', '600 700', 'Arial Bold', '100.89%', '93.17%', '24.78%'],
    ['Bricolage Grotesque Fallback', '400 500', 'Arial', '92.77%', '100.25%', '29.11%'],
    ['Bricolage Grotesque Fallback', '600 800', 'Arial Bold', '91.14%', '102.04%', '29.62%'],
  ])(
    '%s (%s) recale %s sur la police qu’elle remplace',
    (family, weight, local, size, ascent, descent) => {
      const found = face(family, weight);
      expect(found, `${family} ${weight}`).toBeDefined();
      /* `local()` seulement : une face de repli ne télécharge rien. */
      expect(found?.get('src')).toMatch(new RegExp(`^local\\('${local}'\\)`));
      expect(found?.get('src')).not.toContain('url(');
      expect(found?.get('size-adjust')).toBe(size);
      expect(found?.get('ascent-override')).toBe(ascent);
      expect(found?.get('descent-override')).toBe(descent);
      expect(found?.get('line-gap-override')).toBe('0%');
    },
  );

  /* LA FACE DE REPLI NE COUVRE QUE LES GLYPHES DE LA POLICE. Sans cette borne,
     un caractère absent de Chivo (✓, →, espace fine insécable) tomberait sur
     Arial au lieu de la police du système : un changement de rendu, même
     une fois Chivo chargée. */
  it('borne chaque face de repli aux glyphes de la police qu’elle remplace', () => {
    expect(face('Chivo Fallback')?.get('unicode-range')).toBe(
      'U+0020-007E, U+00A0-00FF, U+0102, U+0131, U+0152-0153, U+02BC, U+02C6, U+02DA, U+02DC, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+2009, U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2032-2033, U+2039-203A, U+2044, U+20AC, U+2122, U+2212, U+2215, U+FEFF',
    );
    expect(face('Bricolage Grotesque Fallback')?.get('unicode-range')).toBe(
      'U+0020-007E, U+00A0-00A3, U+00A5-00AC, U+00AE-00FF, U+0102, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+2002, U+2009, U+200B, U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2032-2033, U+2039-203A, U+2044, U+20AC, U+2122, U+2191, U+2193, U+2212',
    );
  });

  it('place la face de repli juste après la police web dans chaque pile', () => {
    expect(root.get('--opale-font-body')).toMatch(/^'Chivo', 'Chivo Fallback', system-ui,/);
    expect(root.get('--opale-font-display')).toMatch(/^'Chivo', 'Chivo Fallback', system-ui,/);
    expect(root.get('--opale-font-title')).toMatch(
      /^'Bricolage Grotesque', 'Bricolage Grotesque Fallback', 'Chivo', 'Chivo Fallback',/,
    );
  });
});
