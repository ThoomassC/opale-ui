import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, withAlpha } from './color';
import opaleSource from '../magic/opale.css?raw';
import docSource from '../styles/doc-v3.css?raw';
import { ruleBody } from '../test/css-rules';

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

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

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
      strip(docSource),
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
