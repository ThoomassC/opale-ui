import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, withAlpha } from './color';
import { declaration } from '../test/css-rules';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   LE SÉPARATEUR SE VOIT.

   Ce contrat est né d'une question posée devant la page du composant : « le
   divider n'est pas visible, non ? ». Il ne l'était pas, pour deux raisons
   qui s'additionnaient.

   1. LA LARGEUR. Un `<hr>` n'a aucune largeur propre : dans un parent flex, ou
      une grille qui aligne ses enfants au début, il s'effondre à 0 px et le
      filet disparaît entièrement. Mesuré dans l'aperçu : 0 × 1 px.

   2. LA TEINTE. Le filet empruntait `--opale-divider`, le liseré des cartes —
      1,30:1 sur la surface claire, 1,09:1 sur la surface sombre. Un liseré
      suffit à détacher une carte, qui a aussi son ombre et son fond ; un
      séparateur, lui, n'a QUE son trait.

   LE SEUIL N'EST PAS UN CRITÈRE WCAG. Un séparateur est décoratif, 1.4.11 ne
   l'exige pas. 1,6:1 est un plancher de VISIBILITÉ : le trait doit se voir sur
   les trois fonds où il se pose, dans les deux thèmes.
   ========================================================================== */

const VISIBILITY_FLOOR = 1.6;

const GROUNDS = ['--opale-background', '--opale-surface', '--opale-surface-sunken'] as const;

describe('Divider', () => {
  it('devrait occuper toute la largeur de son conteneur, quel qu’il soit', () => {
    expect(declaration(opaleSource, '.opale-divider', 'inline-size')).toBe('100%');
  });

  describe('le trait tient son plancher de visibilité', () => {
    const themes = new Map<string, Theme>(
      parseThemes(opaleSource).map((theme) => [theme.name, theme]),
    );

    /* Le trait est l'encre du texte à une fraction d'opacité : il suit donc le
       thème sans jeton dédié, et le calcul compose exactement ce que peint le
       navigateur. */
    const share = () => {
      const match =
        /^1px solid color-mix\(in srgb, var\(--opale-text\) (\d+)%, transparent\)$/.exec(
          declaration(opaleSource, '.opale-divider', 'border-top') ?? '',
        );
      expect(match, 'filet attendu : color-mix de --opale-text sur transparent').not.toBeNull();
      return Number(match?.[1]) / 100;
    };

    for (const themeName of ['light', 'dark-explicit'] as const) {
      for (const ground of GROUNDS) {
        it(`devrait tenir ${VISIBILITY_FLOOR}:1 sur ${ground} en ${themeName}`, () => {
          const theme = themes.get(themeName) as Theme;
          const paper = resolveToken(theme, ground);
          const line = compositeOver(
            withAlpha(resolveToken(theme, '--opale-text'), share()),
            paper,
          );

          expect(contrastRatio(line, paper)).toBeGreaterThanOrEqual(VISIBILITY_FLOOR);
        });
      }
    }
  });
});
