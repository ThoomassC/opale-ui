import { describe, expect, it } from 'vitest';

import { contrastRatio } from './color';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   CHAQUE FOND DE SECTION PORTE SON ENCRE, ET ELLE SE LIT.

   `ScrollSection` peint toujours son propre couple fond / encre : c'est ce
   qui garde un texte lisible pendant que la scène, derrière, change de fond.
   Le couple vient de deux jetons, `--opale-ground-<nom>` et
   `--opale-ground-<nom>-ink`, déclarés sur `:root`. Ce contrat les résout
   dans chaque thème et exige l'AA du texte courant, 4,5:1 (WCAG 1.4.3).

   Seul `paper` suit le thème — la surface et l'encre d'Opale : il se mesure
   en clair ET en sombre. Les trois autres sont des teintes fixes, les mêmes
   partout ; ils se mesurent quand même dans les deux thèmes, pour qu'une
   surcharge sombre écrite par mégarde ne passe pas inaperçue.
   ========================================================================== */

const AA_TEXT = 4.5;
const GROUNDS = ['paper', 'amber', 'night', 'blue'] as const;

const themes = new Map<string, Theme>(parseThemes(opaleSource).map((t) => [t.name, t]));

describe('les fonds de ScrollSection', () => {
  for (const name of ['light', 'dark-explicit'] as const) {
    for (const ground of GROUNDS) {
      it(`tient ${AA_TEXT}:1 entre ${ground} et son encre en ${name}`, () => {
        const theme = themes.get(name) as Theme;
        const fill = resolveToken(theme, `--opale-ground-${ground}`);
        const ink = resolveToken(theme, `--opale-ground-${ground}-ink`);
        expect(fill).toMatch(/^#|^rgb/);
        expect(ink).toMatch(/^#|^rgb/);
        expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }

  it('donne au papier la surface et l’encre du thème, et une valeur sombre', () => {
    const light = themes.get('light') as Theme;
    const dark = themes.get('dark-explicit') as Theme;
    expect(resolveToken(light, '--opale-ground-paper')).toBe(
      resolveToken(light, '--opale-surface-base'),
    );
    expect(resolveToken(light, '--opale-ground-paper-ink')).toBe(
      resolveToken(light, '--opale-text'),
    );
    expect(resolveToken(dark, '--opale-ground-paper')).toBe(
      resolveToken(dark, '--opale-surface-base'),
    );
    expect(resolveToken(dark, '--opale-ground-paper-ink')).toBe(resolveToken(dark, '--opale-text'));
    expect(resolveToken(dark, '--opale-ground-paper')).not.toBe(
      resolveToken(light, '--opale-ground-paper'),
    );
  });

  it('pose les teintes fixes décidées pour l’ambre, la nuit et le bleu', () => {
    const light = themes.get('light') as Theme;
    expect(resolveToken(light, '--opale-ground-amber')).toBe('#f4ad15');
    expect(resolveToken(light, '--opale-ground-amber-ink')).toBe('#14100b');
    expect(resolveToken(light, '--opale-ground-night')).toBe('#121713');
    expect(resolveToken(light, '--opale-ground-night-ink')).toBe('#f3f1ec');
    expect(resolveToken(light, '--opale-ground-blue')).toBe('#315c9e');
    expect(resolveToken(light, '--opale-ground-blue-ink')).toBe('#ffffff');
  });
});

/* ============================================================================
   LES BOUTONS IMBRIQUÉS RESTENT VISIBLES SUR LEUR FOND.

   Mesuré au navigateur : sur `blue`, le bouton principal sombre (#5d87cb)
   tombait à 1,84:1 contre le fond, le secondaire à 2,26:1 ; sur `amber`, le
   secondaire à 2,97:1. La feuille de ScrollSection surcharge, dans la
   section seulement, les jetons que lisent les boutons : sur `blue`, le
   principal s'inverse (aplat blanc, encre bleue, survol teinté) et le
   secondaire passe à un bleu pâle sous l'encre sombre ; sur `amber`, le
   secondaire fonce. Ce contrat résout ces couples depuis les jetons : l'aplat
   tient 3:1 contre le fond (WCAG 1.4.11), au repos et au survol, et le texte
   4,5:1 sur l'aplat.
   ========================================================================== */

const AA_GRAPHIC = 3;

/* `color-mix(in srgb, a p%, b)`, comme le survol du secondaire. */
function mixSrgb(one: string, other: string, share: number): string {
  const channels = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  const [a, b] = [channels(one), channels(other)];
  const mixed = a.map((value, index) => Math.round(value * share + b[index] * (1 - share)));
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

describe('les boutons dans une ScrollSection', () => {
  const light = themes.get('light') as Theme;
  const dark = themes.get('dark-explicit') as Theme;
  const token = (theme: Theme, name: string) => resolveToken(theme, name);
  const shade = token(light, '--opale-shade');

  it('inverse le principal sur `blue` : aplat, encre et survol', () => {
    const ground = token(light, '--opale-ground-blue');
    const fill = token(light, '--opale-ground-blue-ink');
    const hover = token(light, '--opale-ground-blue-hover');
    expect(contrastRatio(fill, ground)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    expect(contrastRatio(ground, fill)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(hover, ground)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    expect(contrastRatio(ground, hover)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('pose un secondaire pâle sur `blue`, sous l’encre sombre du thème local', () => {
    const ground = token(light, '--opale-ground-blue');
    const fill = token(light, '--opale-ground-blue-secondary');
    const hover = mixSrgb(fill, shade, 0.86);
    const ink = token(dark, '--opale-on-fill');
    expect(contrastRatio(fill, ground)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    expect(contrastRatio(hover, ground)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(ink, hover)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('fonce le secondaire sur `amber`, sous l’encre claire du thème local', () => {
    const ground = token(light, '--opale-ground-amber');
    const fill = token(light, '--opale-ground-amber-secondary');
    const hover = mixSrgb(fill, shade, 0.86);
    const ink = token(light, '--opale-on-fill');
    expect(contrastRatio(fill, ground)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    expect(contrastRatio(hover, ground)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(ink, hover)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
