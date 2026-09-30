import { describe, expect, it } from 'vitest';

import { contrastRatio } from './color';
import { parseThemes, resolveToken, stripComments } from './stylesheet';
import type { Theme } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   L'ENCRE DES REMPLISSAGES SUIT LE THÈME OÙ ELLE EST POSÉE.

   Les jetons basculaient en sombre sur `:root[data-theme='dark']` ET sur
   `[data-opale-page-theme='dark']` — le thème local de PageScaffold —, mais
   les correctifs d'encre ne visaient que la racine. Dans une section sombre
   d'une page claire, le texte des boutons restait clair : 3,48:1 sur le
   primaire, 2,82:1 sur le secondaire, 2,94:1 sur le danger. Et l'inverse,
   racine sombre et section claire, tombait à 2,90:1.

   L'encre et les remplissages sont maintenant des JETONS, redéfinis dans
   chaque bloc de thème : ils héritent comme le reste, quelle que soit
   l'imbrication.
   ========================================================================== */

const AA_TEXT = 4.5;

const themes = new Map<string, Theme>(parseThemes(opaleSource).map((t) => [t.name, t]));
const css = stripComments(opaleSource);

describe('l’encre des remplissages', () => {
  it('ne dépend plus d’un sélecteur de racine', () => {
    for (const target of [
      '.opale-button--primary',
      '.opale-button--secondary',
      '.opale-button--danger',
      '.opale-checkbox:checked',
      '.opale-toast {',
      '.opale-pagination button',
    ]) {
      expect(
        css,
        `« :root[data-theme='dark'] ${target} » ne suivrait pas le thème local de PageScaffold.`,
      ).not.toContain(`:root[data-theme='dark'] ${target}`);
    }
  });

  it('déclare l’encre et les remplissages de ton dans le bloc sombre', () => {
    const dark = themes.get('dark-explicit') as Theme;
    for (const token of [
      '--opale-on-fill',
      '--opale-fill-success',
      '--opale-fill-warning',
      '--opale-fill-danger',
      '--opale-fill-info',
    ]) {
      expect(dark.overrides.has(token), `${token} absent du bloc sombre`).toBe(true);
    }
  });

  for (const name of ['light', 'dark-explicit'] as const) {
    for (const fill of ['--opale-primary', '--opale-secondary-dark', '--opale-danger']) {
      it(`tient ${AA_TEXT}:1 sur ${fill} en ${name}`, () => {
        const theme = themes.get(name) as Theme;
        const ink = resolveToken(theme, '--opale-on-fill');
        const ground = resolveToken(theme, fill);
        expect(ink).toMatch(/^#|^rgb/);
        expect(contrastRatio(ink, ground)).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }
});
