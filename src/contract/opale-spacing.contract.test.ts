import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import { declarations, stripComments } from '../test/css-rules';
import headerControlsSource from '../opale/components/header-controls/HeaderControls.module.css?raw';
import pageScaffoldSource from '../opale/components/page-scaffold/PageScaffold.module.css?raw';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   LES ESPACEMENTS ET LES RAYONS DE LA CHARPENTE SONT SUR L'ÉCHELLE.

   HeaderControls et PageScaffold posent leurs marges, retraits et gouttières
   sur `--opale-space-*`, et leurs rayons sur `--opale-radius-*`. Une longueur
   qui n'a pas de pas dans l'échelle (2 rem, 2,5 rem) reste littérale, mais
   sur la grille de 4 px. Aucun trait ne tombe entre deux pixels.
   ========================================================================== */

const sheets = {
  'HeaderControls.module.css': headerControlsSource,
  'PageScaffold.module.css': pageScaffoldSource,
};

const SPACING = /^(padding|margin|gap|row-gap|column-gap)(-|$)/;
const LENGTH = /(?<![\w.-])(-?\d*\.?\d+)(rem|px)\b/g;
const PX_PER_REM = 16;

describe('l’échelle des rayons', () => {
  it('déclare un pas `xs` pour les petits objets', () => {
    expect(declarations(opaleSource, ':root').get('--opale-radius-xs')).toBe('0.125rem');
  });
});

describe('la charpente', () => {
  const root = declarations(opaleSource, ':root');
  const steps = [...root]
    .filter(([name]) => name.startsWith('--opale-space-'))
    .map(([, value]) => Number.parseFloat(value) * PX_PER_REM);

  for (const [name, raw] of Object.entries(sheets)) {
    const ast = postcss.parse(stripComments(raw));

    it(`${name} espace sur l’échelle, ou à défaut sur la grille de 4 px`, () => {
      const offenders: string[] = [];
      ast.walkDecls((decl) => {
        if (!SPACING.test(decl.prop)) return;
        for (const [, amount, unit] of decl.value.matchAll(LENGTH)) {
          const px = Math.abs(Number(amount) * (unit === 'rem' ? PX_PER_REM : 1));
          if (px === 0 || (unit === 'px' && px === 1)) continue;
          if (steps.includes(px)) offenders.push(`${decl.prop}: ${decl.value} (pas de l’échelle)`);
          else if (px % 4 !== 0) offenders.push(`${decl.prop}: ${decl.value} (hors grille)`);
        }
      });
      expect(offenders).toEqual([]);
    });

    it(`${name} arrondit par l’échelle des rayons`, () => {
      const offenders: string[] = [];
      /* Seule dérivée admise : 0,68 fois `--opale-squircle-radius`, lui-même
         `min(--opale-radius-md, 50%)` — le rayon qui contient un squircle,
         que prend la boîte au focus pour que l'anneau suive la forme. */
      ast.walkDecls(/radius$/, (decl) => {
        if (
          !/^(0|50%|var\(--opale-radius-[\w-]+\)|calc\(var\(--opale-squircle-radius\) \* 0\.68\))$/.test(
            decl.value,
          )
        ) {
          offenders.push(`${decl.prop}: ${decl.value}`);
        }
      });
      expect(offenders).toEqual([]);
    });

    it(`${name} trace des filets d’un nombre entier de pixels`, () => {
      const offenders: string[] = [];
      ast.walkDecls(/^border/, (decl) => {
        if (/\d\.\d+px/.test(decl.value)) offenders.push(`${decl.prop}: ${decl.value}`);
      });
      expect(offenders).toEqual([]);
    });
  }
});
