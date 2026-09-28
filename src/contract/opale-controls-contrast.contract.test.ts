import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, withAlpha } from './color';
import { parseThemes, resolveToken, ruleBodies, stripComments } from './stylesheet';
import type { Theme } from './stylesheet';
import opaleSource from '../magic/opale.css?raw';

/* ============================================================================
   LES CONTRÔLES SE VOIENT, ET LEUR TEXTE SE LIT.

   Trois défauts mesurés par l'audit :
   - la bordure des champs (le liseré des cartes) tenait 1,30:1 sur la surface
     claire et 1,09:1 en sombre : on ne voyait pas où saisir (WCAG 1.4.11) ;
   - l'interrupteur éteint tenait 2,05:1 contre la surface, et sa poignée
     blanche 2,05:1 contre la piste ;
   - l'encre du Feedback « warning » tenait 3,81:1 sur son lavis (1.4.3).
   ========================================================================== */

const themes = new Map<string, Theme>(parseThemes(opaleSource).map((t) => [t.name, t]));
const css = stripComments(opaleSource);

/** Un jeton résolu, `color-mix(in srgb, A N%, B)` composé comme le peint le navigateur. */
function paint(theme: Theme, value: string): string {
  const token = /^var\((--[\w-]+)\)$/.exec(value)?.[1] ?? (value.startsWith('--') ? value : null);
  const resolved = token ? resolveToken(theme, token) : value;
  const mix = /^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/.exec(resolved);
  if (!mix) return resolved;
  return compositeOver(withAlpha(paint(theme, mix[1]), Number(mix[2]) / 100), paint(theme, mix[3]));
}

const rule = (selector: string) => ruleBodies(css, selector).join('\n');

describe('les contrôles', () => {
  it('bordent les champs et la liste multiple avec le jeton de champ', () => {
    expect(rule('.opale-input-shell')).toMatch(/border-color:\s*var\(--opale-field-border\)/);
    expect(rule('.opale-multiselect')).toMatch(/border:\s*1px solid var\(--opale-field-border\)/);
    expect(rule('.opale-toggle-track')).toMatch(/background:\s*var\(--opale-field-border\)/);
    expect(rule('.opale-toggle-thumb')).toMatch(/background:\s*var\(--opale-surface\)/);
  });

  for (const name of ['light', 'dark-explicit'] as const) {
    describe(name, () => {
      const theme = themes.get(name) as Theme;
      const border = () => paint(theme, '--opale-field-border');

      for (const ground of ['--opale-surface', '--opale-background', '--opale-surface-sunken']) {
        it(`trace la bordure des champs à 3:1 sur ${ground}`, () => {
          expect(contrastRatio(border(), paint(theme, ground))).toBeGreaterThanOrEqual(3);
        });
      }

      it('détache la poignée de la piste, éteinte comme allumée', () => {
        const thumb = paint(theme, '--opale-surface');
        expect(contrastRatio(thumb, border())).toBeGreaterThanOrEqual(3);
        expect(contrastRatio(thumb, paint(theme, '--opale-primary'))).toBeGreaterThanOrEqual(3);
      });

      it('écrit le Feedback « warning » à 4,5:1 sur son lavis', () => {
        const wash = paint(
          theme,
          'color-mix(in srgb, var(--opale-warning) 9%, var(--opale-surface))',
        );
        expect(
          contrastRatio(paint(theme, '--opale-warning-on-surface'), wash),
        ).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});
