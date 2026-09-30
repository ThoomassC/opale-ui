import type { BrandTheme } from '../../contract/brand';
import { parseRgba } from '../../contract/color';
import { parseThemes, resolveToken } from '../../contract/stylesheet';
import type { Theme } from '../../contract/stylesheet';
import opaleSource from '../../opale/opale.css?raw';
import { OPALE_TOKENS, TOKEN_GROUPS, publicTokens } from '../../opale/tokens-manifest';
import type { TokenEntry, TokenGroup } from '../../opale/tokens-manifest';

/* =============================================================================
   LES DONNÉES DE LA PAGE « PERSONNALISER », LUES DANS LA FEUILLE.

   Aucune valeur par défaut n'est recopiée ici : la table et l'essai de marque
   lisent `opale.css` au build, par le même lecteur que le contrat. Une valeur
   qui change dans la feuille change sur la page, sans qu'on la touche.
   ========================================================================== */

function themeNamed(name: Theme['name']): Theme {
  const theme = parseThemes(opaleSource).find((entry) => entry.name === name);
  if (!theme) throw new Error(`opale.css ne déclare pas le thème « ${name} »`);
  return theme;
}

const LIGHT = themeNamed('light');
const DARK = themeNamed('dark-explicit');

export interface TokenRow extends TokenEntry {
  readonly groupLabel: string;
  /** La valeur déclarée sur `:root`, telle qu'écrite. */
  readonly light: string;
  /** La valeur redéclarée sous `:root[data-theme='dark']`, ou `null` si elle ne change pas. */
  readonly dark: string | null;
}

const GROUP_LABEL = new Map<TokenGroup, string>(
  TOKEN_GROUPS.map((group) => [group.id, group.label]),
);

export const TOKEN_ROWS: readonly TokenRow[] = publicTokens().map((entry) => ({
  ...entry,
  groupLabel: GROUP_LABEL.get(entry.group) ?? entry.group,
  light: LIGHT.tokens.get(entry.name) ?? '',
  dark: DARK.overrides.get(entry.name) ?? null,
}));

/** Les groupes qui ont au moins un jeton public, dans l'ordre du manifeste. */
export const PUBLIC_GROUPS = TOKEN_GROUPS.filter((group) =>
  TOKEN_ROWS.some((row) => row.group === group.id),
);

/** Le nombre de jetons internes, dit en clair sous la table. */
export const INTERNAL_COUNT = OPALE_TOKENS.filter((entry) => entry.status === 'internal').length;

/** Les champs de l'essai de marque, et le jeton dont chacun part. */
export type BrandField = 'primary' | 'secondary' | 'danger' | 'accent' | 'primaryOnSurface';

export const BRAND_FIELDS: readonly {
  readonly field: BrandField;
  readonly label: string;
  readonly token: string;
  /** Le champ ne s'affiche qu'en sombre, où il diffère du primaire. */
  readonly darkOnly?: boolean;
}[] = [
  { field: 'primary', label: 'Primaire', token: '--opale-primary' },
  { field: 'secondary', label: 'Secondaire (fond du bouton)', token: '--opale-secondary-dark' },
  { field: 'danger', label: 'Danger', token: '--opale-danger' },
  { field: 'accent', label: 'Accent', token: '--opale-accent' },
  {
    field: 'primaryOnSurface',
    label: 'Primaire écrit sur surface',
    token: '--opale-primary-light',
    darkOnly: true,
  },
];

/* Les couleurs par défaut d'Opale, thème par thème, aplaties en hexadécimal :
   c'est la seule forme qu'un `<input type="color">` accepte. */
function toHex(color: string): string {
  const { red, green, blue } = parseRgba(color);
  return `#${[red, green, blue].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

function defaultsFor(theme: Theme): Record<BrandField, string> {
  const read = (token: string) => toHex(resolveToken(theme, token));
  return {
    primary: read('--opale-primary'),
    secondary: read('--opale-secondary-dark'),
    danger: read('--opale-danger'),
    accent: read('--opale-accent'),
    primaryOnSurface: read('--opale-primary-light'),
  };
}

export const BRAND_DEFAULTS: Readonly<Record<BrandTheme, Record<BrandField, string>>> = {
  light: defaultsFor(LIGHT),
  dark: defaultsFor(DARK),
};

/* La marque d'exemple de la page, un vert : `personnaliser.test.tsx` la passe
   à `checkBrand`, donc la recette publiée tient réellement ses contrastes. */
export const EXAMPLE_BRAND = {
  light: {
    primary: '#16a34a',
    primaryOnSurface: '#15803d',
    focus: '#15803d',
    onPrimary: '#14100b',
  },
  dark: {
    primary: '#4ade80',
    primaryOnSurface: '#86efac',
    onPrimary: '#0c0f0d',
  },
} as const;
