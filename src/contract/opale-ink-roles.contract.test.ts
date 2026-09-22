import { describe, expect, it } from 'vitest';

import { contrastRatio } from './color';
import { parseThemes, resolveToken, stripComments } from './stylesheet';
import type { Theme } from './stylesheet';
import opaleSource from '../magic/opale.css?raw';
import docSource from '../styles/doc-v3.css?raw';

/* ============================================================================
   UN JETON PAR RÔLE.

   Ce contrat est né d'un bogue signalé à l'œil : « le Tag V3 n'est pas visible
   en mode sombre sur la plupart des pages ». La cause n'était pas la pastille
   mais une règle de nommage absente — `--opale-accent-dark` servait à la fois
   de FOND ambré et d'ENCRE sur ambre, et `--opale-primary` à la fois de fond
   de bouton plein et d'encre posée sur une surface. Un jeton qui porte deux
   rôles ne peut pas suivre deux thèmes : en sombre le fond doit s'assombrir et
   l'encre s'éclaircir. La pastille mesurait 1,01:1.

   Les deux § ci-dessous tiennent les deux moitiés de la correction. Le premier
   interdit l'usage du jeton de FOND comme `color:` — c'est la faute de départ,
   et elle est invisible en thème clair, donc rien d'autre ne l'attrape. Le
   second MESURE les encres de remplacement contre les surfaces réelles des
   deux thèmes : sans lui, on pourrait satisfaire le premier en plaquant
   n'importe quelle valeur.
   ========================================================================== */

/** Jetons de fond : ils remplissent, ils n'écrivent pas. */
const FILL_ONLY = ['--opale-primary', '--opale-accent', '--opale-accent-dark'] as const;

const AA_TEXT = 4.5; // WCAG 1.4.3
const AA_NON_TEXT = 3; // WCAG 1.4.11 — graphiques porteurs de sens

const SHEETS = [
  { name: 'opale.css', source: opaleSource },
  { name: 'doc-v3.css', source: docSource },
] as const;

describe('les jetons de remplissage ne servent jamais d’encre', () => {
  it.each(SHEETS)('devrait n’en déclarer aucun en « color: » dans $name', ({ source }) => {
    const css = stripComments(source);
    const offenders = FILL_ONLY.flatMap((token) => {
      const pattern = new RegExp(`(^|[;{])\\s*color:\\s*var\\(\\s*${token}\\s*\\)`, 'g');
      return [...css.matchAll(pattern)].map(() => token);
    });

    expect(
      offenders,
      'Ces jetons remplissent un fond ; comme encre ils ne suivent pas le thème sombre. ' +
        'Utilisez --opale-primary-on-surface, --opale-accent-ink ou --opale-accent-graphic.',
    ).toEqual([]);
  });
});

describe('les encres de surface tiennent leur seuil dans les deux thèmes', () => {
  const themes = parseThemes(opaleSource);
  const byName = new Map<string, Theme>(themes.map((theme) => [theme.name, theme]));

  /**
   * Les fonds sur lesquels ces encres se posent réellement : le sol de la
   * page, la carte, et la surface creusée qui est le plus clair des trois en
   * thème clair — donc le pire cas pour une encre sombre.
   */
  const GROUNDS = ['--opale-background', '--opale-surface', '--opale-surface-sunken'] as const;

  const CASES = [
    { token: '--opale-primary-on-surface', floor: AA_TEXT },
    { token: '--opale-accent-ink', floor: AA_TEXT },
    { token: '--opale-accent-graphic', floor: AA_NON_TEXT },
  ] as const;

  for (const theme of ['light', 'dark-explicit'] as const) {
    for (const { token, floor } of CASES) {
      for (const ground of GROUNDS) {
        it(`devrait tenir ${floor}:1 pour ${token} sur ${ground} en ${theme}`, () => {
          const resolved = byName.get(theme);
          expect(resolved, `thème ${theme} absent de opale.css`).toBeDefined();

          const ink = resolveToken(resolved as Theme, token);
          const paper = resolveToken(resolved as Theme, ground);
          expect(ink, `${token} non résolu`).toMatch(/^#|^rgb/);
          expect(paper, `${ground} non résolu`).toMatch(/^#|^rgb/);

          expect(contrastRatio(ink, paper)).toBeGreaterThanOrEqual(floor);
        });
      }
    }
  }
});
