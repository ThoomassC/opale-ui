import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, withAlpha } from './color';
import { parseThemes, resolveToken, type Theme } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';
import docSource from '../styles/doc-v3.css?raw';
import { parseRules, ruleBody, stripComments } from '../test/css-rules';

/* =============================================================================
   L'ANNEAU DISCRET DE LA VITRINE TIENT 3:1 SUR CHAQUE SOL.

   L'anneau de focus avait été éteint à la demande du propriétaire : il jurait
   — un rectangle bleu autour de contrôles en squircle, doublé d'un filet
   citron. Il revient, discret : un trait de 2 px, graphite, tiré de l'encre du
   texte, au clavier seulement.

   « DISCRET » A UN PLANCHER, ET IL EST MESURÉ ICI. Un indicateur de focus doit
   contraster à 3:1 avec ce qui l'entoure (WCAG 1.4.11). La proposition de
   départ — l'encre à 40 % — ne mesurait que 2,56:1 sur le fond clair : un
   anneau qu'on ne voit pas. 50 % est le premier palier qui passe partout.
   ========================================================================== */

const AA_NON_TEXT = 3;

function token(body: string, name: string): string {
  const value = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(body)?.[1];
  expect(value, `${name} introuvable`).toBeDefined();
  return value as string;
}

const LIGHT = ruleBody(opaleSource, ':root') ?? '';
const DARK = ruleBody(opaleSource, ":root[data-theme='dark']") ?? '';

const SURFACES = [
  '--opale-background',
  '--opale-surface',
  '--opale-surface-base',
  '--opale-surface-sunken',
];

/** La part d'encre de l'anneau, lue dans la feuille : le test suit la valeur. */
const MIX = (() => {
  const match =
    /--tc-doc-focus-ring:\s*color-mix\(in srgb,\s*var\(--opale-text\)\s*(\d+)%,\s*transparent\)/.exec(
      stripComments(docSource),
    );
  expect(match, '--tc-doc-focus-ring doit mêler l’encre du texte à du transparent').not.toBeNull();
  return Number(match?.[1]) / 100;
})();

describe('l’anneau de focus de la vitrine', () => {
  it.each([
    ['clair', LIGHT],
    ['sombre', DARK],
  ] as const)('devrait tenir 3:1 contre chaque sol en thème %s', (_, body) => {
    const ink = token(body, '--opale-text');
    for (const surface of SURFACES) {
      const ground = token(body, surface);
      const ring = compositeOver(withAlpha(ink, MIX), ground);
      expect(contrastRatio(ring, ground), `anneau sur ${surface}`).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      );
    }
  });
});

/* =============================================================================
   L'ANNEAU SE RECALCULE DANS UN THÈME LOCAL.

   Un `color-mix()` se résout là où il est DÉCLARÉ, puis hérite de sa valeur.
   Déclaré sur `:root, .tc-doc` seulement, l'anneau gardait l'encre claire
   dans une section sombre : mesuré à 1,02:1 sur le fond `night` d'une
   ScrollSection, et le même défaut touchait un PageScaffold sombre. Il est
   donc redit sur chaque thème local, et sur chaque portée d'Opale, qui peut
   redéfinir l'encre.
   ========================================================================== */
describe('l’anneau de la vitrine dans un thème local', () => {
  it('est redéclaré sur `[data-opale-page-theme]` et `[data-opale-scope]`', () => {
    const declaring = parseRules(docSource).filter(
      (rule) => rule.context.length === 0 && /--tc-doc-focus-ring\s*:\s*color-mix/.test(rule.body),
    );
    expect(declaring).toHaveLength(1);
    expect(declaring[0].selectors).toEqual(
      expect.arrayContaining([':root', '.tc-doc', '[data-opale-page-theme]', '[data-opale-scope]']),
    );
    expect(declaring[0].body).toMatch(/--opale-focus:\s*var\(--tc-doc-focus-ring\)/);
  });
});

/* =============================================================================
   SUR UN FOND DE COULEUR, L'ANNEAU EST CELUI D'OPALE.

   L'encre à 50 % ne peut pas tenir 3:1 sur un bleu moyen : 2,71:1 mesuré sur
   le fond `blue` d'une ScrollSection, même recalculée dans le thème local.
   Dans une section `amber`, `night` ou `blue`, la vitrine rend donc la main à
   l'anneau d'Opale : `--opale-focus` y vaut l'encre du primaire sur une
   surface — la formule même d'Opale pour une marque dérivée, et la valeur de
   ses jetons par défaut —, et l'anneau propre de la vitrine la suit.
   ========================================================================== */
describe('l’anneau de la vitrine sur un fond de ScrollSection', () => {
  const SELECTOR = ".tc-doc .opale-scroll-section:not([data-ground='paper'])";
  const themes = new Map<string, Theme>(parseThemes(opaleSource).map((t) => [t.name, t]));

  it('rend la main à l’anneau d’Opale dans les sections de couleur', () => {
    const body = ruleBody(docSource, SELECTOR) ?? '';
    expect(body).toMatch(/--opale-focus:\s*var\(--opale-primary-on-surface\)/);
    expect(body).toMatch(/--tc-doc-focus-ring:\s*var\(--opale-focus\)/);
  });

  it.each([
    ['amber', 'light'],
    ['night', 'dark-explicit'],
    ['blue', 'dark-explicit'],
  ] as const)('tient 3:1 sur le fond %s, dans son thème local', (ground, theme) => {
    const local = themes.get(theme) as Theme;
    const ring = resolveToken(local, '--opale-primary-on-surface');
    const fill = resolveToken(local, `--opale-ground-${ground}`);
    expect(contrastRatio(ring, fill)).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});
