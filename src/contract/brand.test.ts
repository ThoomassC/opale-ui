import { describe, expect, it } from 'vitest';

import { BRAND_THEME_REFERENCE, checkBrand } from './brand';
import type { BrandReport, BrandRole, BrandTheme } from './brand';
import { contrastRatio } from './color';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   UNE MARQUE SE VALIDE AVANT DE SE PUBLIER.

   L'encre des boutons pleins est `--opale-on-fill`, #fbfaf9 en clair. Posez
   `--opale-primary: #16a34a` (le vert de l'audit) : 3,16:1, sous le seuil de
   4,5:1 d'un libellé de 14 px. Rien ne le disait. `checkBrand` mesure les
   paires qui comptent — encre sur remplissage, rôle écrit sur la surface,
   anneau de focus sur le fond — et propose l'encre qui tient.

   Les valeurs de référence (encres, surfaces) sont recopiées dans
   `brand.ts`, parce que le contrat n'ouvre aucun fichier ; ce test les
   compare à la feuille réelle, thème par thème.
   ========================================================================== */

const themes = new Map<string, Theme>(parseThemes(opaleSource).map((t) => [t.name, t]));

function role(report: BrandReport, name: BrandRole) {
  const found = report.roles.find((entry) => entry.role === name);
  if (!found) throw new Error(`rôle « ${name} » absent du rapport`);
  return found;
}

describe('les valeurs de référence de checkBrand', () => {
  const SHEET_THEME: Record<BrandTheme, string> = { light: 'light', dark: 'dark-explicit' };

  for (const theme of ['light', 'dark'] as const) {
    it(`reprennent celles d’opale.css en ${theme}`, () => {
      const sheet = themes.get(SHEET_THEME[theme]) as Theme;
      const reference = BRAND_THEME_REFERENCE[theme];

      expect(reference.onFill).toBe(resolveToken(sheet, '--opale-on-fill'));
      expect(reference.onAccent).toBe(resolveToken(sheet, '--opale-on-accent'));
      expect(reference.text).toBe(resolveToken(sheet, '--opale-text'));
      expect(reference.surface).toBe(resolveToken(sheet, '--opale-surface'));
      expect(reference.background).toBe(resolveToken(sheet, '--opale-background'));
    });
  }
});

describe('checkBrand sur la marque d’Opale', () => {
  it('passe en clair avec les couleurs par défaut', () => {
    const light = themes.get('light') as Theme;
    const report = checkBrand({
      primary: resolveToken(light, '--opale-primary'),
      secondary: resolveToken(light, '--opale-secondary-dark'),
      danger: resolveToken(light, '--opale-danger'),
      accent: resolveToken(light, '--opale-accent'),
    });

    expect(report.failures).toEqual([]);
    expect(report.pass).toBe(true);
    expect(report.theme).toBe('light');
  });

  it('passe en sombre quand l’encre sur surface est la reprise claire', () => {
    const dark = themes.get('dark-explicit') as Theme;
    const report = checkBrand(
      {
        primary: resolveToken(dark, '--opale-primary'),
        primaryOnSurface: resolveToken(dark, '--opale-primary-light'),
        secondary: resolveToken(dark, '--opale-secondary-dark'),
        danger: resolveToken(dark, '--opale-danger'),
        dangerOnSurface: resolveToken(dark, '--opale-danger-on-surface'),
        focus: resolveToken(dark, '--opale-focus'),
        accent: resolveToken(dark, '--opale-accent'),
      },
      { theme: 'dark' },
    );

    expect(report.failures).toEqual([]);
    expect(report.pass).toBe(true);
  });

  it('ne mesure que les rôles fournis', () => {
    const report = checkBrand({ primary: '#315c9e' });
    expect(report.roles.map((entry) => entry.role)).toEqual(['primary']);
  });
});

describe('checkBrand sur les marques de l’audit', () => {
  it('signale le vert #16a34a : 3,16:1 avec l’encre claire par défaut', () => {
    const report = checkBrand({ primary: '#16a34a' });
    const primary = role(report, 'primary');

    expect(primary.ink.foreground).toBe('#fbfaf9');
    expect(primary.ink.ratio).toBeCloseTo(3.16, 2);
    expect(primary.ink.minimum).toBe(4.5);
    expect(primary.ink.pass).toBe(false);
    expect(report.pass).toBe(false);
  });

  it('propose l’encre sombre du thème pour le vert, et le jeton à poser', () => {
    const primary = role(checkBrand({ primary: '#16a34a' }), 'primary');

    expect(primary.suggestedInk.token).toBe('--opale-on-primary');
    expect(primary.suggestedInk.value).toBe(BRAND_THEME_REFERENCE.light.text);
    expect(primary.suggestedInk.ratio).toBeCloseTo(contrastRatio('#14100b', '#16a34a'), 5);
    expect(primary.suggestedInk.pass).toBe(true);
    expect(primary.suggestedInk.changed).toBe(true);
  });

  it('signale le vert écrit sur la surface (lien, bouton à lavis)', () => {
    const primary = role(checkBrand({ primary: '#16a34a' }), 'primary');
    const onSurface = primary.onSurface.find((check) => check.background === '#ffffff');

    expect(onSurface?.minimum).toBe(4.5);
    expect(onSurface?.ratio).toBeCloseTo(3.3, 1);
    expect(onSurface?.pass).toBe(false);
  });

  it('signale l’orange #ea580c : 3,41:1, et propose l’encre sombre', () => {
    const primary = role(checkBrand({ primary: '#ea580c' }), 'primary');

    expect(primary.ink.ratio).toBeCloseTo(3.41, 2);
    expect(primary.ink.pass).toBe(false);
    expect(primary.suggestedInk.value).toBe('#14100b');
    expect(primary.suggestedInk.pass).toBe(true);
  });

  it('écrit un échec lisible, avec le jeton et la valeur à poser', () => {
    const report = checkBrand({ primary: '#16a34a' });

    expect(report.failures.some((line) => line.includes('3,16:1'))).toBe(true);
    expect(report.failures.some((line) => line.includes('--opale-on-primary: #14100b'))).toBe(true);
  });

  it('passe quand l’encre suggérée est posée', () => {
    const report = checkBrand({ primary: '#16a34a', onPrimary: '#14100b' });
    const primary = role(report, 'primary');

    expect(primary.ink.pass).toBe(true);
    expect(primary.suggestedInk.changed).toBe(false);
  });

  it('mesure l’anneau de focus à 3:1 sur le fond, par défaut le primaire', () => {
    const report = checkBrand({ primary: '#ea580c' });

    expect(report.focus.length).toBeGreaterThan(0);
    for (const check of report.focus) {
      expect(check.foreground).toBe('#ea580c');
      expect(check.minimum).toBe(3);
    }
  });
});

describe('les autres rôles', () => {
  it('garde l’encre du danger distincte de celle du primaire', () => {
    const report = checkBrand({ primary: '#ffe14d', danger: '#b3261e' });

    expect(role(report, 'primary').suggestedInk.value).toBe('#14100b');
    expect(role(report, 'danger').ink.pass).toBe(true);
    expect(role(report, 'danger').suggestedInk.token).toBe('--opale-on-danger');
    expect(role(report, 'danger').suggestedInk.changed).toBe(false);
  });

  it('mesure l’ambre avec son encre propre, --opale-on-accent', () => {
    const accent = role(checkBrand({ primary: '#315c9e', accent: '#f4ad15' }), 'accent');

    expect(accent.ink.foreground).toBe('#241a03');
    expect(accent.ink.pass).toBe(true);
    expect(accent.suggestedInk.token).toBe('--opale-on-accent');
    expect(accent.onSurface).toEqual([]);
  });

  it('propose --opale-on-secondary pour le fond du bouton secondaire', () => {
    const secondary = role(checkBrand({ primary: '#315c9e', secondary: '#7fc8f8' }), 'secondary');

    expect(secondary.ink.pass).toBe(false);
    expect(secondary.suggestedInk.token).toBe('--opale-on-secondary');
    expect(secondary.suggestedInk.value).toBe('#14100b');
  });

  it('mesure les encres sombres du thème sombre', () => {
    const primary = role(checkBrand({ primary: '#16a34a' }, { theme: 'dark' }), 'primary');

    expect(primary.ink.foreground).toBe(BRAND_THEME_REFERENCE.dark.onFill);
    expect(primary.suggestedInk.value).toBe(BRAND_THEME_REFERENCE.dark.onFill);
  });

  it('accepte des neutres surchargés par l’hôte', () => {
    const report = checkBrand(
      { primary: '#315c9e' },
      { reference: { surface: '#315c9e', background: '#315c9e' } },
    );
    const primary = role(report, 'primary');

    expect(primary.onSurface.every((check) => check.ratio === 1)).toBe(true);
    expect(report.pass).toBe(false);
  });
});

describe('les entrées refusées', () => {
  it('refuse une couleur illisible en nommant le rôle', () => {
    expect(() => checkBrand({ primary: 'vert' })).toThrow(/primary/);
  });

  it('refuse une couleur translucide : son contraste dépend du fond', () => {
    expect(() => checkBrand({ primary: 'rgba(22, 163, 74, 0.5)' })).toThrow(/translucide/);
  });
});

describe('la proposition d’encre', () => {
  it('garde une encre qui tient, même si une autre ferait mieux', () => {
    /* Sur l'ambre, l'encre du texte (#14100b) dépasse --opale-on-accent, mais
       celle-ci tient déjà 8,85:1 : rien à poser. */
    const accent = role(checkBrand({ primary: '#315c9e', accent: '#f4ad15' }), 'accent');
    expect(accent.suggestedInk.value).toBe('#241a03');
    expect(accent.suggestedInk.changed).toBe(false);
  });
});

describe('checkBrand — une référence partielle', () => {
  /* Une clé présente mais `undefined` (un objet construit à la main, une
     option relayée) ne doit pas écraser le neutre du thème. */
  it('devrait ignorer une entrée `undefined` de `reference`', () => {
    const report = checkBrand({ primary: '#315c9e' }, { reference: { surface: undefined } });
    expect(report).toEqual(checkBrand({ primary: '#315c9e' }));
  });
});
