/**
 * La validation d'une marque, avant qu'elle parte en production.
 *
 * Surcharger `--opale-primary` suffit à habiller Opale, et c'est précisément
 * le risque : l'encre des boutons pleins reste `--opale-on-fill`, réglée pour
 * le saphir. Le vert #16a34a y tombe à 3,16:1, l'orange #ea580c à 3,41:1 —
 * sous les 4,5:1 d'un libellé — et rien ne le signalait. `contrastRatio`
 * existait, mais il fallait savoir QUELLES paires mesurer.
 *
 * `checkBrand` les nomme : l'encre de chaque rôle sur son remplissage, le rôle
 * écrit sur la surface et sur le fond (liens, boutons à lavis), l'anneau de
 * focus sur les deux. Pour chaque remplissage, il propose la meilleure des
 * deux encres du thème et le jeton qui la porte (`--opale-on-primary`…).
 *
 * Fonction pure, sans DOM ni fichier : elle s'appelle dans un test Vitest du
 * projet hôte comme dans une page de démonstration.
 */
import { contrastRatio, parseRgba } from './color.js';

/** Le thème mesuré : les encres et les surfaces de référence en dépendent. */
export type BrandTheme = 'light' | 'dark';

/** Les rôles qui portent un remplissage plein, donc une encre à choisir. */
export type BrandRole = 'primary' | 'secondary' | 'danger' | 'accent';

/** Le jeton d'encre propre à chaque rôle, qui vaut `--opale-on-fill` par défaut. */
export type BrandInkToken =
  '--opale-on-primary' | '--opale-on-secondary' | '--opale-on-danger' | '--opale-on-accent';

/**
 * Les couleurs d'une marque, pour UN thème. Toutes opaques.
 *
 * Chaque rôle est la couleur de son REMPLISSAGE : pour le secondaire, c'est
 * le fond du bouton, `--opale-secondary-dark`.
 */
export interface BrandColors {
  /** `--opale-primary` : le fond des boutons pleins. */
  readonly primary: string;
  /** Le fond du bouton secondaire, `--opale-secondary-dark`. */
  readonly secondary?: string;
  /** `--opale-danger`. */
  readonly danger?: string;
  /** `--opale-accent`, qui porte une encre sombre. */
  readonly accent?: string;
  /**
   * Le primaire quand il ÉCRIT sur une surface (liens, lavis, pastilles).
   * Par défaut le primaire lui-même, comme en thème clair ; en sombre, Opale
   * écrit avec `--opale-primary-light` : passez-le ici.
   */
  readonly primaryOnSurface?: string;
  /** Le danger quand il écrit sur une surface. Par défaut le danger lui-même. */
  readonly dangerOnSurface?: string;
  /** `--opale-focus`. Par défaut le primaire. */
  readonly focus?: string;
  /** L'encre déjà posée sur `--opale-on-primary`, si l'hôte l'a surchargée. */
  readonly onPrimary?: string;
  readonly onSecondary?: string;
  readonly onDanger?: string;
  readonly onAccent?: string;
}

/** Les encres et les neutres d'un thème, contre lesquels la marque est mesurée. */
export interface BrandThemeReference {
  /** `--opale-on-fill` : l'encre des remplissages pleins. */
  readonly onFill: string;
  /** `--opale-on-accent` : l'encre sombre posée sur l'ambre. */
  readonly onAccent: string;
  /** `--opale-text` : l'encre du texte, l'autre candidate d'une encre de rôle. */
  readonly text: string;
  /** `--opale-surface`. */
  readonly surface: string;
  /** `--opale-background`. */
  readonly background: string;
}

/**
 * Les valeurs d'`opale.css`, recopiées parce que le contrat n'ouvre aucun
 * fichier. `brand.test.ts` les compare à la feuille, thème par thème : une
 * valeur qui dérive rougit là.
 */
export const BRAND_THEME_REFERENCE: Readonly<Record<BrandTheme, BrandThemeReference>> = {
  light: {
    onFill: '#fbfaf9',
    onAccent: '#241a03',
    text: '#14100b',
    surface: '#ffffff',
    background: '#f7f4ef',
  },
  dark: {
    onFill: '#0c0f0d',
    onAccent: '#241a03',
    text: '#f3f1ec',
    surface: '#262c27',
    background: '#0c0f0d',
  },
};

export interface CheckBrandOptions {
  /** `'light'` par défaut. */
  readonly theme?: BrandTheme;
  /** Des neutres ou des encres surchargés par l'hôte, pris à la place de ceux d'Opale. */
  readonly reference?: Partial<BrandThemeReference>;
}

/** Le seuil d'un texte (WCAG 1.4.3) : libellés de 14 px en 600 compris. */
export const BRAND_TEXT_MINIMUM = 4.5;

/** Le seuil d'un élément graphique (WCAG 1.4.11) : anneau de focus. */
export const BRAND_GRAPHIC_MINIMUM = 3;

/** Une paire mesurée. */
export interface BrandContrastCheck {
  /** Ce que mesure la paire, en français, jetons nommés. */
  readonly label: string;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly minimum: number;
  readonly pass: boolean;
}

/**
 * L'encre proposée pour un remplissage : celle en place tant qu'elle tient
 * 4,5:1, sinon la meilleure des encres du thème. Une encre qui tient ne se
 * remplace pas pour gagner un point de ratio.
 */
export interface BrandInkSuggestion {
  readonly token: BrandInkToken;
  readonly value: string;
  readonly ratio: number;
  readonly pass: boolean;
  /** Vrai quand la proposition diffère de l'encre mesurée : le jeton est à poser. */
  readonly changed: boolean;
}

export interface BrandRoleReport {
  readonly role: BrandRole;
  /** Le jeton du remplissage mesuré. */
  readonly token: string;
  readonly fill: string;
  /** L'encre en place (surchargée ou par défaut) sur le remplissage. */
  readonly ink: BrandContrastCheck;
  readonly suggestedInk: BrandInkSuggestion;
  /** Le rôle écrit sur la surface et sur le fond. Vide pour le secondaire et l'ambre. */
  readonly onSurface: readonly BrandContrastCheck[];
  readonly pass: boolean;
}

export interface BrandReport {
  readonly theme: BrandTheme;
  readonly pass: boolean;
  readonly roles: readonly BrandRoleReport[];
  /** L'anneau de focus sur la surface et sur le fond. */
  readonly focus: readonly BrandContrastCheck[];
  /** Un message par paire sous son seuil, prêt pour un `expect(…).toEqual([])`. */
  readonly failures: readonly string[];
}

interface RoleSpec {
  readonly role: BrandRole;
  readonly token: string;
  readonly inkToken: BrandInkToken;
  readonly inkField: 'onPrimary' | 'onSecondary' | 'onDanger' | 'onAccent';
  /** Le champ de la couleur qui écrit sur surface, ou `null` si le rôle n'écrit pas. */
  readonly textField: 'primaryOnSurface' | 'dangerOnSurface' | null;
}

const ROLES: readonly RoleSpec[] = [
  {
    role: 'primary',
    token: '--opale-primary',
    inkToken: '--opale-on-primary',
    inkField: 'onPrimary',
    textField: 'primaryOnSurface',
  },
  {
    role: 'secondary',
    token: '--opale-secondary-dark',
    inkToken: '--opale-on-secondary',
    inkField: 'onSecondary',
    textField: null,
  },
  {
    role: 'danger',
    token: '--opale-danger',
    inkToken: '--opale-on-danger',
    inkField: 'onDanger',
    textField: 'dangerOnSurface',
  },
  {
    role: 'accent',
    token: '--opale-accent',
    inkToken: '--opale-on-accent',
    inkField: 'onAccent',
    textField: null,
  },
];

/** Deux décimales, virgule française : « 3,16:1 ». */
function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2).replace('.', ',')}:1`;
}

function formatMinimum(minimum: number): string {
  return `${String(minimum).replace('.', ',')}:1`;
}

/**
 * Une couleur de marque lisible et opaque, ou une erreur qui nomme son champ.
 * `contrastRatio` refuserait aussi, mais sans dire QUEL rôle est en cause.
 */
function assertBrandColor(field: string, color: string): void {
  let alpha: number;
  try {
    ({ alpha } = parseRgba(color));
  } catch (error) {
    throw new Error(`checkBrand : ${field} « ${color} » n’est pas une couleur lisible.`, {
      cause: error,
    });
  }
  if (alpha < 1) {
    throw new Error(
      `checkBrand : ${field} « ${color} » est translucide ; son contraste dépend de ce ` +
        'qu’il y a derrière. Donnez la couleur opaque effectivement peinte.',
    );
  }
}

function measure(
  label: string,
  foreground: string,
  background: string,
  minimum: number,
): BrandContrastCheck {
  const ratio = contrastRatio(foreground, background);
  return { label, foreground, background, ratio, minimum, pass: ratio >= minimum };
}

/** La meilleure encre parmi les candidates ; à égalité, la première (l'encre en place). */
function bestInk(fill: string, candidates: readonly string[]): { value: string; ratio: number } {
  let best = { value: candidates[0], ratio: contrastRatio(candidates[0], fill) };
  for (const candidate of candidates.slice(1)) {
    const ratio = contrastRatio(candidate, fill);
    if (ratio > best.ratio) best = { value: candidate, ratio };
  }
  return best;
}

function failureOf(check: BrandContrastCheck): string {
  return `${check.label} : ${formatRatio(check.ratio)} < ${formatMinimum(check.minimum)}`;
}

/**
 * Mesure une marque contre les encres et les neutres d'un thème d'Opale.
 *
 * ```ts
 * const report = checkBrand({ primary: '#16a34a' });
 * expect(report.failures).toEqual([]);
 * // → « encre --opale-on-fill sur --opale-primary : 3,16:1 < 4,5:1 —
 * //    posez --opale-on-primary: #14100b (5,75:1) »
 * ```
 *
 * Seuls les rôles fournis sont mesurés ; une marque se valide thème par thème.
 */
export function checkBrand(colors: BrandColors, options: CheckBrandOptions = {}): BrandReport {
  const theme = options.theme ?? 'light';
  /* Une clé présente mais `undefined` n'écrase pas le neutre du thème : le
     spread la recopierait telle quelle, et `contrastRatio` lèverait. */
  const overrides = Object.fromEntries(
    Object.entries(options.reference ?? {}).filter(([, value]) => value !== undefined),
  ) as Partial<BrandThemeReference>;
  const reference: BrandThemeReference = {
    ...BRAND_THEME_REFERENCE[theme],
    ...overrides,
  };

  for (const [field, value] of Object.entries(colors)) {
    if (typeof value === 'string') assertBrandColor(field, value);
  }
  for (const [field, value] of Object.entries(options.reference ?? {})) {
    if (typeof value === 'string') assertBrandColor(`reference.${field}`, value);
  }

  const grounds = [
    { token: '--opale-surface', color: reference.surface },
    { token: '--opale-background', color: reference.background },
  ] as const;

  const failures: string[] = [];

  const roles = ROLES.flatMap((spec): BrandRoleReport[] => {
    const fill = colors[spec.role];
    if (fill === undefined) return [];

    const defaultInk = spec.role === 'accent' ? reference.onAccent : reference.onFill;
    const inkInPlace = colors[spec.inkField];
    const ink = inkInPlace ?? defaultInk;
    const inkName =
      inkInPlace === undefined && spec.role !== 'accent' ? '--opale-on-fill' : spec.inkToken;

    const inkCheck = measure(`encre ${inkName} sur ${spec.token}`, ink, fill, BRAND_TEXT_MINIMUM);

    /* L'encre en place reste tant qu'elle tient ; sinon la meilleure des deux
       encres du thème, l'une claire, l'autre sombre. */
    const best = inkCheck.pass
      ? { value: ink, ratio: inkCheck.ratio }
      : bestInk(fill, [ink, reference.onFill, reference.text]);
    const suggestedInk: BrandInkSuggestion = {
      token: spec.inkToken,
      value: best.value,
      ratio: best.ratio,
      pass: best.ratio >= BRAND_TEXT_MINIMUM,
      changed: best.value !== ink,
    };

    const writer = spec.textField === null ? undefined : (colors[spec.textField] ?? fill);
    const onSurface =
      writer === undefined
        ? []
        : grounds.map((ground) =>
            measure(
              `${spec.textField === 'primaryOnSurface' ? '--opale-primary-on-surface' : '--opale-danger-on-surface'} écrit sur ${ground.token}`,
              writer,
              ground.color,
              BRAND_TEXT_MINIMUM,
            ),
          );

    if (!inkCheck.pass) {
      failures.push(
        suggestedInk.pass
          ? `${failureOf(inkCheck)} — posez ${suggestedInk.token}: ${suggestedInk.value} (${formatRatio(suggestedInk.ratio)})`
          : `${failureOf(inkCheck)} — aucune encre du thème ne tient 4,5:1 sur ${fill} ; ` +
              'foncez ou éclaircissez le remplissage.',
      );
    }
    for (const check of onSurface) {
      if (!check.pass) failures.push(failureOf(check));
    }

    return [
      {
        role: spec.role,
        token: spec.token,
        fill,
        ink: inkCheck,
        suggestedInk,
        onSurface,
        pass: inkCheck.pass && onSurface.every((check) => check.pass),
      },
    ];
  });

  const focusColor = colors.focus ?? colors.primary;
  const focus = grounds.map((ground) =>
    measure(
      `anneau --opale-focus sur ${ground.token}`,
      focusColor,
      ground.color,
      BRAND_GRAPHIC_MINIMUM,
    ),
  );
  for (const check of focus) {
    if (!check.pass) failures.push(failureOf(check));
  }

  return {
    theme,
    pass: failures.length === 0,
    roles,
    focus,
    failures,
  };
}
