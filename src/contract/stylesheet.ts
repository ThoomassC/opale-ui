/**
 * Reads a token stylesheet as *text* and rebuilds the three themes it declares.
 *
 * It opens no file and touches no DOM: the caller passes CSS source, which
 * keeps the contract runnable in CI, in a Node script, or against a string
 * fixture. What it buys is the guard that a comment could never be — the
 * portfolio and travels_in_world drifted apart on six tokens *despite* a
 * comment forbidding it, because nothing executed that comment.
 *
 * Everything below scans character by character rather than by regex. That is
 * not fastidiousness: a regex that counts braces loses a whole rule to a
 * `content: "}"`, and one that splits on `;` truncates a font stack at the
 * first semicolon inside a quoted family name. Both failures are silent, and a
 * contract that silently reads less than the sheet reports green on what it
 * never looked at.
 */

/** Alias resolution stops here; a longer chain is a mistake, not a design. */
const VAR_HOP_LIMIT = 10;

const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;

/**
 * At-rules that group without conditioning. Their body applies exactly as if
 * the braces were not there, so a `:root` inside one is a plain `:root`.
 * `@media`, `@supports` and `@container` are deliberately absent: descending
 * into those would let a conditional block masquerade as the base theme.
 */
const TRANSPARENT_AT_RULES = ['@layer', '@scope'];

/** Media preludes that mean "dark, unconditionally". Normalised, spaces out. */
const UNCONDITIONAL_DARK = new Set([
  '(prefers-color-scheme:dark)',
  'screen and (prefers-color-scheme:dark)',
  'all and (prefers-color-scheme:dark)',
]);

/**
 * The three ways a theme reaches the page. Two of them are dark, and they must
 * never disagree: `dark-os` serves the system preference with zero JavaScript,
 * `dark-explicit` serves a deliberate choice and has to outrank it.
 */
export type ThemeName = 'light' | 'dark-os' | 'dark-explicit';

export interface Theme {
  readonly name: ThemeName;
  /** Every token in force for this theme, light values included. */
  readonly tokens: ReadonlyMap<string, string>;
  /**
   * Only what this theme's own block redeclares. Empty for `light`.
   *
   * Assert on this, not on `tokens`, when comparing the two dark themes:
   * merged maps always share their keys, so a dropped override is invisible
   * there whenever the light value happens to match.
   */
  readonly overrides: ReadonlyMap<string, string>;
}

/**
 * Strips comments before anything else is read.
 *
 * This is not tidiness. A token sheet quotes hexadecimals in its comments —
 * measured ratios, superseded values, worked examples. Parse first and the
 * last write wins, so a value that exists only inside a comment silently
 * beats the real declaration.
 */
export function stripComments(css: string): string {
  return css.replace(CSS_COMMENT, ' ');
}

/**
 * Index just past the string literal opening at `start`, escapes honoured.
 * Returns `start + 1` for an unterminated string, which lets the caller keep
 * scanning instead of hanging.
 */
function skipString(css: string, start: number): number {
  const quote = css[start];
  for (let index = start + 1; index < css.length; index += 1) {
    if (css[index] === '\\') {
      index += 1;
      continue;
    }
    if (css[index] === quote) return index + 1;
  }
  return start + 1;
}

/** Index of the `}` closing the `{` at `open`, or -1 if the source is broken. */
function matchingBrace(css: string, open: number): number {
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    const char = css[index];
    if (char === '"' || char === "'") {
      index = skipString(css, index) - 1;
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

/** One top-level rule: what came before the brace, and what came inside it. */
interface Rule {
  readonly prelude: string;
  readonly body: string;
}

/**
 * The rules directly inside `css`, statements without a body skipped.
 *
 * The prelude is cut from the last `}` *or* `;` before the brace, so a
 * preceding `@import "x.css";` or `@charset` does not get glued onto the next
 * selector — which would make that rule unfindable, silently.
 */
function topLevelRules(css: string): readonly Rule[] {
  const rules: Rule[] = [];
  let preludeStart = 0;

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];

    if (char === '"' || char === "'") {
      index = skipString(css, index) - 1;
      continue;
    }

    if (char === ';') {
      preludeStart = index + 1;
      continue;
    }

    if (char === '{') {
      const close = matchingBrace(css, index);
      if (close === -1) {
        throw new Error(
          `accolade non refermée après \`${normalizeSelector(css.slice(preludeStart, index))}\``,
        );
      }
      rules.push({
        prelude: css.slice(preludeStart, index).trim(),
        body: css.slice(index + 1, close),
      });
      index = close;
      preludeStart = close + 1;
    }
  }

  return rules;
}

/**
 * The bodies of every rule whose selector list contains `selector`.
 *
 * Several bodies come back on purpose: a sheet may declare `:root` more than
 * once — primitives in one file, roles in another, concatenated. A grouped
 * selector (`:root, body { … }`) counts, because it does to a browser.
 * Grouping at-rules are descended into; conditional ones never are.
 */
export function ruleBodies(css: string, selector: string): readonly string[] {
  const bodies: string[] = [];
  const needle = normalizeSelector(selector);

  for (const rule of topLevelRules(css)) {
    if (rule.prelude.startsWith('@')) {
      const keyword = rule.prelude.split(/[\s({]/, 1)[0].toLowerCase();
      if (TRANSPARENT_AT_RULES.includes(keyword)) {
        bodies.push(...ruleBodies(rule.body, selector));
      }
      continue;
    }
    if (selectorList(rule.prelude).includes(needle)) {
      bodies.push(rule.body);
    }
  }

  return bodies;
}

/** The normalised members of a selector list, commas inside `()` respected. */
function selectorList(prelude: string): readonly string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < prelude.length; index += 1) {
    const char = prelude[index];
    if (char === '"' || char === "'") {
      index = skipString(prelude, index) - 1;
    } else if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === ',' && depth === 0) {
      parts.push(prelude.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(prelude.slice(start));

  return parts.map(normalizeSelector).filter((part) => part.length > 0);
}

/**
 * Collapses whitespace so selectors compare by shape.
 *
 * Quote style is normalised too: `[data-theme='dark']` and `[data-theme="dark"]`
 * are the same selector to a browser, and a contract that told them apart would
 * report a missing dark theme over a formatting choice Prettier makes for us.
 * Whitespace inside brackets goes as well, so `:not( [x] )` still matches.
 *
 * Unquoted attribute values are quoted too. A minifier writes
 * `:root[data-theme=dark]`, and the published `opale.css` is minified: before
 * this, the contract read the installed sheet as having no dark theme at all
 * and measured the light one under its name — green, and wrong.
 */
function normalizeSelector(prelude: string): string {
  return prelude
    .replace(/'/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\s*([([\]),>+~])\s*/g, '$1')
    .replace(/\[([\w-]+)\s*([~|^$*]?=)\s*([^\]"\s]+)(\s+[is])?\]/gi, '[$1$2"$3"$4]')
    .trim();
}

/**
 * The bodies of every `@media` that turns dark on unconditionally.
 *
 * A prelude that mentions dark but qualifies it — `not all and (…)`,
 * `(min-width: 40em) and (…)` — throws rather than being read as if it
 * applied. Reading it silently is the worst of the three options: the earlier
 * version did, and it measured the contrast of a dark theme that no browser
 * would ever paint.
 */
function darkMediaBodies(css: string): readonly string[] {
  const bodies: string[] = [];

  for (const rule of topLevelRules(css)) {
    if (!rule.prelude.toLowerCase().startsWith('@media')) continue;

    const condition = rule.prelude.slice('@media'.length).replace(/\s+/g, ' ').trim();

    // On resserre autour de `:` et à l'intérieur des parenthèses, mais PAS
    // avant une parenthèse ouvrante : `screen and (…)` doit rester séparé de
    // son `and`, sans quoi il ne se reconnaît plus dans la liste ci-dessus.
    const collapsed = condition
      .replace(/\s*:\s*/g, ':')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .toLowerCase();

    if (UNCONDITIONAL_DARK.has(collapsed)) {
      bodies.push(rule.body);
      continue;
    }
    if (collapsed.includes('prefers-color-scheme:dark')) {
      throw new Error(
        `\`@media ${condition}\` mentionne le thème sombre sous condition : ` +
          `le contrat ne sait pas dire quand ce bloc s'applique, et le lire comme ` +
          `un sombre inconditionnel serait un mensonge. Sortez la condition ou ` +
          `déclarez le thème sombre dans un \`@media (prefers-color-scheme: dark)\` nu.`,
      );
    }
  }

  return bodies;
}

/**
 * Custom properties of one rule body, later declarations winning.
 *
 * Declarations are split on top-level semicolons: a `;` inside a quoted font
 * name or inside `url(…)` does not end anything, and a final declaration
 * written without its semicolon is still a declaration.
 */
export function parseCustomProperties(body: string): Map<string, string> {
  const tokens = new Map<string, string>();

  for (const statement of splitStatements(body)) {
    const colon = statement.indexOf(':');
    if (colon === -1) continue;

    const name = statement.slice(0, colon).trim();
    if (!name.startsWith('--')) continue;

    tokens.set(name, statement.slice(colon + 1).trim().replace(/\s+/g, ' '));
  }

  return tokens;
}

/** Splits on `;` at nesting depth zero, outside strings and braces. */
function splitStatements(body: string): readonly string[] {
  const statements: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (char === '"' || char === "'") {
      index = skipString(body, index) - 1;
    } else if (char === '(' || char === '{') depth += 1;
    else if (char === ')' || char === '}') depth -= 1;
    else if (char === ';' && depth === 0) {
      statements.push(body.slice(start, index));
      start = index + 1;
    }
  }
  statements.push(body.slice(start));

  return statements.map((statement) => statement.trim()).filter((statement) => statement.length > 0);
}

/** A selector, and whether it must sit inside a dark colour-scheme query. */
interface BlockSpec {
  readonly selector: string;
  readonly insideDarkMedia: boolean;
}

const LIGHT_SELECTOR = ':root';

const DARK_BLOCKS: ReadonlyArray<readonly [ThemeName, BlockSpec]> = [
  ['dark-os', { selector: ':root:not([data-theme="light"])', insideDarkMedia: true }],
  ['dark-explicit', { selector: ':root[data-theme="dark"]', insideDarkMedia: false }],
];

/**
 * Rebuilds the three themes.
 *
 * Each dark theme is the light theme *overridden* by its own block, because
 * that is what the cascade does: a sheet where a colour is declared only in a
 * dark block leaves that colour undefined in the unmarked state. Returning the
 * merged map is what lets a caller assert on a dark theme without silently
 * reading a hole — and `overrides` is what lets it check the hole is not there.
 */
export function parseThemes(css: string): readonly Theme[] {
  const source = stripComments(css);

  const light = new Map<string, string>();
  for (const body of ruleBodies(source, LIGHT_SELECTOR)) {
    for (const [name, value] of parseCustomProperties(body)) {
      light.set(name, value);
    }
  }

  if (light.size === 0) {
    throw new Error('aucun bloc `:root` nu trouvé : la feuille ne déclare pas de thème clair');
  }

  const darkMedia = darkMediaBodies(source).join('\n');

  const themes: Theme[] = [{ name: 'light', tokens: light, overrides: new Map() }];

  for (const [name, spec] of DARK_BLOCKS) {
    const scope = spec.insideDarkMedia ? darkMedia : source;
    const overrides = new Map<string, string>();
    for (const body of ruleBodies(scope, spec.selector)) {
      for (const [token, value] of parseCustomProperties(body)) {
        overrides.set(token, value);
      }
    }
    themes.push({ name, tokens: new Map([...light, ...overrides]), overrides });
  }

  return themes;
}

/**
 * The value of `name` in `theme`, with every `var()` substituted in place.
 *
 * Substitution, not navigation. An earlier version jumped to the referenced
 * token and returned its value, which quietly truncated any composite:
 * `--elevation-1: 0 0.125rem 0.375rem var(--shadow-ink)` came back as the bare
 * shadow colour, and the three elevations then registered as colours. A
 * contract that silently drops two thirds of a value is worse than no contract.
 *
 * Throws on an absent token rather than returning undefined: a contract that
 * skips what it cannot find reports green on a sheet it never read.
 */
export function resolveToken(theme: Theme, name: string): string {
  const seed = theme.tokens.get(name);
  if (seed === undefined) {
    throw new Error(`jeton \`${name}\` absent du thème \`${theme.name}\``);
  }

  let value = seed;

  // The exit condition is "no `var()` left", never "the value stopped
  // changing": `--a: var(--a)` substitutes into itself, so a fixed point is
  // exactly what a direct cycle looks like.
  for (let hop = 0; hop <= VAR_HOP_LIMIT; hop += 1) {
    if (!value.includes('var(')) return value;
    value = expandVars(value, theme, name);
  }

  throw new Error(
    `\`${name}\` traverse plus de ${VAR_HOP_LIMIT} alias dans \`${theme.name}\` : chaîne circulaire ?`,
  );
}

/**
 * Replaces every `var(--x)` in `value` by the value of `--x`, once.
 *
 * The `var(` span is found by matching parentheses, not by `[^)]*`: a fallback
 * may itself hold a `var()`, and stopping at the first `)` leaves an orphan
 * bracket glued to the result — `"#112233)"` sails past a contrast check as a
 * malformed colour, or worse, past a string comparison unnoticed.
 *
 * The fallback is parsed but never used: a missing token is an error here.
 */
function expandVars(value: string, theme: Theme, origin: string): string {
  let result = '';
  let index = 0;

  while (index < value.length) {
    const start = value.indexOf('var(', index);
    if (start === -1) {
      result += value.slice(index);
      break;
    }

    const close = matchingParen(value, start + 3);
    if (close === -1) {
      result += value.slice(index);
      break;
    }

    const reference = value.slice(start + 4, close).split(',', 1)[0].trim();
    const referenced = theme.tokens.get(reference);
    if (referenced === undefined) {
      throw new Error(
        `jeton \`${reference}\` absent du thème \`${theme.name}\` (atteint en suivant \`${origin}\`)`,
      );
    }

    result += value.slice(index, start) + referenced;
    index = close + 1;
  }

  return result;
}

/** Index of the `)` closing the `(` at `open`, or -1. */
function matchingParen(text: string, open: number): number {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' || char === "'") {
      index = skipString(text, index) - 1;
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

const COLOUR_VALUE = /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|oklab\(|color\()/i;

/**
 * Every token whose resolved value names a colour rather than a length.
 *
 * Deliberately not defensive: an unresolvable token throws out of here instead
 * of being classified as "not a colour". Swallowing that was the same mistake
 * `resolveToken` warns about — a caller iterating this list to check contrasts
 * would have checked everything except the tokens that were broken.
 */
export function colourTokens(theme: Theme): readonly string[] {
  return [...theme.tokens.keys()].filter((name) =>
    COLOUR_VALUE.test(resolveToken(theme, name).trim()),
  );
}
