/**
 * The colour contract — the part of this library that has to exist first.
 *
 * `portfolio` and `travels_in_world` both carried a comment promising their
 * palettes were identical. Six tokens drifted anyway, and nothing said a word,
 * because a comment is not a guard. These helpers are the guard: they read a
 * token sheet as text, rebuild its three themes, and recompute every ratio the
 * comments claim. A wrong number fails CI on the day it is written.
 *
 * Nothing here imports React, touches the DOM, or opens a file. It is a
 * development dependency, never a runtime one, so it costs a consumer's
 * JavaScript budget exactly zero bytes.
 */

export type { Oklab, RgbaColor } from './color.js';
export {
  MID_GREY_LUMINANCE,
  compositeLayers,
  compositeOver,
  contrastRatio,
  deltaEOklab,
  oklab,
  oklchHue,
  oklchHueDistance,
  parseColor,
  parseRgba,
  relativeLuminance,
  withAlpha,
} from './color.js';

export type { Theme, ThemeName } from './stylesheet.js';
export {
  colourTokens,
  parseCustomProperties,
  parseThemes,
  resolveToken,
  ruleBodies,
  stripComments,
} from './stylesheet.js';

/*
 * Le SUPPORT composé — la pièce qui manquait, et la seule dont l'absence se
 * payait en duplication. Le portfolio nommait ses piles de cartes dans son
 * fichier de test (`CARD_FLOORS`, `WASH_SUPPORTS`), `travels_in_world` dans le
 * sien (une fonction `stack()` maison) : deux copies d'un même modèle, donc
 * deux définitions du mot « fond » qui dérivent. Elles arrivent ici.
 *
 * `resolveBackdrop` ne recalcule rien : il assemble `resolveToken` et
 * `compositeLayers` et NOMME le résultat, ce qui est précisément ce qui manque
 * à un message d'échec quand soixante piles sont mesurées d'un coup.
 */
export type { BackdropSpec, LayerSpec } from './backdrop.js';
export {
  DECOR_BACKDROPS,
  GLASS_BACKDROPS,
  GLASS_LAYERS,
  SEMANTIC_WASHES,
  STATE_WASHES,
  nested,
  resolveBackdrop,
  withWash,
} from './backdrop.js';

/*
 * LA VALIDATION D'UNE MARQUE. Surcharger `--opale-primary` suffit à habiller
 * Opale, mais l'encre des boutons pleins reste celle du saphir : le vert
 * #16a34a y tombe à 3,16:1. `checkBrand` mesure les paires qui comptent et
 * propose l'encre à poser sur `--opale-on-primary`, `--opale-on-secondary`,
 * `--opale-on-danger` ou `--opale-on-accent`.
 */
export type {
  BrandColors,
  BrandContrastCheck,
  BrandInkSuggestion,
  BrandInkToken,
  BrandReport,
  BrandRole,
  BrandRoleReport,
  BrandTheme,
  BrandThemeReference,
  CheckBrandOptions,
} from './brand.js';
export {
  BRAND_GRAPHIC_MINIMUM,
  BRAND_TEXT_MINIMUM,
  BRAND_THEME_REFERENCE,
  checkBrand,
} from './brand.js';
