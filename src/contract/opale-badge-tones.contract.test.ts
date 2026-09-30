import { describe, expect, it } from 'vitest';

import { declarations } from '../test/css-rules';
import { compositeOver, contrastRatio } from './color';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   LES TONS D'OPALE SUR LA PASTILLE TIENNENT 4,5:1 (DX-10).

   `Badge` ne connaissait que `primary`, `accent` et `danger` : « Payé »,
   « En attente », « Échec » n'étaient pas exprimables. Les quatre tons
   ajoutés — `success`, `warning`, `info`, `neutral` — sont des LAVIS
   translucides, comme les trois d'avant : leur contraste n'existe donc que
   composé sur ce qu'il y a dessous. Le contrat compose le fond de la pastille
   sur les trois sols réels (page, carte, surface creusée) de chacun des trois
   thèmes, puis mesure l'encre dessus. Le texte d'une pastille fait 12 px :
   c'est le seuil du texte courant, 4,5:1, qui s'applique (WCAG 1.4.3).
   ========================================================================== */

const AA_TEXT = 4.5;
const TONES = ['success', 'warning', 'info', 'neutral'] as const;
const GROUNDS = ['--opale-background', '--opale-surface', '--opale-surface-sunken'] as const;

const themes = parseThemes(opaleSource);

/** Résout une valeur de déclaration — `var()` compris — dans un thème. */
function resolveValue(theme: Theme, value: string): string {
  const probe = '--opale-contract-probe';
  const probed: Theme = { ...theme, tokens: new Map([...theme.tokens, [probe, value]]) };
  return resolveToken(probed, probe);
}

describe('les tons OpaleTone de la pastille', () => {
  it.each(TONES)('déclarent un fond et une encre pour .opale-badge--%s', (tone) => {
    const rule = declarations(opaleSource, `.opale-badge--${tone}`);

    expect(rule.get('background'), `fond de .opale-badge--${tone}`).toBeDefined();
    expect(rule.get('color'), `encre de .opale-badge--${tone}`).toBeDefined();
  });

  it.each(TONES.filter((tone) => tone !== 'neutral'))(
    'tirent le fond de --opale-fill-%s',
    (tone) => {
      expect(declarations(opaleSource, `.opale-badge--${tone}`).get('background')).toContain(
        `var(--opale-fill-${tone})`,
      );
    },
  );

  for (const theme of themes) {
    for (const tone of TONES) {
      for (const ground of GROUNDS) {
        it(`tient ${AA_TEXT}:1 en ${theme.name}, ton ${tone}, sur ${ground}`, () => {
          const rule = declarations(opaleSource, `.opale-badge--${tone}`);
          const floor = resolveToken(theme, ground);
          const fill = compositeOver(resolveValue(theme, rule.get('background') ?? ''), floor);
          const ink = resolveValue(theme, rule.get('color') ?? '');

          expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(AA_TEXT);
        });
      }
    }
  }
});
