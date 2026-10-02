import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { contrastRatio, parseRgba } from './color';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme, ThemeName } from './stylesheet';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   LE CONTRAT LIT LA FEUILLE QUE LE CONSOMMATEUR INSTALLE, PAS SEULEMENT LA SOURCE.

   `parseThemes(dist/opale/opale.css)` rendait un `dark-explicit` à ZÉRO
   surcharge (103 jetons clairs, 0 sombre) : le minificateur écrit
   `:root[data-theme=dark]`, sans guillemets, et la normalisation ne le
   rapprochait pas de `[data-theme="dark"]`. Un consommateur qui mesurait ses
   contrastes sombres sur la feuille installée mesurait donc le thème clair, et
   son test passait au vert (audit THM-07). Sur la source, 35 surcharges : le
   défaut n'apparaissait qu'après le build.

   Ce fichier minifie la source avec le minificateur du build (`cssMinify:
   'esbuild'` dans `vite.lib.config.ts`), ce qui ne dépend d'aucun `dist/`, puis
   relit la vraie feuille publiée quand elle existe.
   ========================================================================== */

const ROOT = resolve(import.meta.dirname, '../..');
const DIST_SHEET = resolve(ROOT, 'dist/opale/opale.css');
/* Le binaire natif, et non l'API JavaScript : sous jsdom, l'API d'esbuild refuse de
   démarrer (son `TextEncoder` n'y rend pas un `Uint8Array` du même royaume). */
const ESBUILD = resolve(ROOT, 'node_modules/esbuild/bin/esbuild');

function named(themes: readonly Theme[], name: ThemeName): Theme {
  const found = themes.find((theme) => theme.name === name);
  if (!found) throw new Error(`thème ${name} absent`);
  return found;
}

let minified = '';

beforeAll(() => {
  minified = execFileSync(ESBUILD, ['--loader=css', '--minify'], {
    input: opaleSource,
    encoding: 'utf8',
  });
});

describe('une feuille minifiée', () => {
  it('écrit bien ses attributs sans guillemets — sans quoi ce test ne prouverait rien', () => {
    expect(minified).toContain(':root[data-theme=dark]');
  });

  it('rend autant de surcharges sombres que la source', () => {
    const fromSource = named(parseThemes(opaleSource), 'dark-explicit');
    const fromMinified = named(parseThemes(minified), 'dark-explicit');

    expect(fromSource.overrides.size).toBeGreaterThan(30);
    expect([...fromMinified.overrides.keys()].sort()).toEqual(
      [...fromSource.overrides.keys()].sort(),
    );
  });

  it('mesure le sombre, et non le clair, sur l’encre des remplissages', () => {
    const dark = named(parseThemes(minified), 'dark-explicit');
    expect(resolveToken(dark, '--opale-on-fill')).toBe('#0c0f0d');
  });
});

describe('les attributs sans guillemets', () => {
  it('se reconnaissent pour le sombre explicite comme pour le sombre du système', () => {
    const css = `:root{--ink:#000}
      @media (prefers-color-scheme:dark){:root:not([data-theme=light]){--ink:#fff}}
      :root[data-theme=dark]{--ink:#eee}`;
    const themes = parseThemes(css);

    expect(named(themes, 'dark-os').overrides.get('--ink')).toBe('#fff');
    expect(named(themes, 'dark-explicit').overrides.get('--ink')).toBe('#eee');
  });

  /* `parseThemes` est public (`./contract`) : ce que 2.9.1 acceptait, il
     l'accepte encore. Un bloc sombre sous un autre sélecteur n'est pas lu —
     comme avant —, et ne fait pas lever d'erreur. */
  it('accepte comme en 2.9.1 un bloc sombre posé sous un autre sélecteur', () => {
    const css = `:root{--ink:#000} .chart[data-theme="dark"]{--chart-grid:#333} html[data-theme=dark]{--ink:#fff}`;
    expect(() => parseThemes(css)).not.toThrow();
    expect(named(parseThemes(css), 'dark-explicit').overrides.size).toBe(0);
  });
});

describe('la feuille publiée', () => {
  it.skipIf(!existsSync(DIST_SHEET))(
    'déclare ses surcharges sombres (npm run build:lib avant ce test)',
    () => {
      const published = readFileSync(DIST_SHEET, 'utf8');
      const dark = named(parseThemes(published), 'dark-explicit');
      const source = named(parseThemes(opaleSource), 'dark-explicit');

      expect([...dark.overrides.keys()].sort()).toEqual([...source.overrides.keys()].sort());
    },
  );
});

/* ============================================================================
   `color-mix()` SE RÉSOUT, OU SE REFUSE EXPLICITEMENT.

   `--opale-field-border`, les `--opale-fill-*` et tous les lavis d'Opale sont
   des `color-mix(in srgb, …)`. `parseRgba` les rejetait par une exception
   générique — un consommateur qui voulait mesurer le bord d'un champ devait
   réécrire le mélange à la main. Le mélange sRGB est désormais calculé ; tout
   autre espace est REFUSÉ par son nom, jamais approximé.
   ========================================================================== */
describe('color-mix', () => {
  it('mélange deux couleurs opaques à parts égales par défaut', () => {
    expect(parseRgba('color-mix(in srgb, #000000, #ffffff)')).toEqual({
      red: 127.5,
      green: 127.5,
      blue: 127.5,
      alpha: 1,
    });
  });

  it('complète la part manquante à 100 %', () => {
    expect(parseRgba('color-mix(in srgb, #ff0000 25%, #0000ff)')).toMatchObject({
      red: 63.75,
      green: 0,
      blue: 191.25,
      alpha: 1,
    });
    expect(parseRgba('color-mix(in srgb, #ff0000, 25% #0000ff)')).toMatchObject({
      red: 191.25,
      blue: 63.75,
    });
  });

  it('prémultiplie l’alpha, comme le navigateur, face à transparent', () => {
    /* Mélanger avec `transparent` ne tire pas la teinte vers le noir : seule
       l'opacité baisse. C'est ce que fait `--opale-button-hover-background`. */
    expect(parseRgba('color-mix(in srgb, #315c9e 8%, transparent)')).toEqual({
      red: 0x31,
      green: 0x5c,
      blue: 0x9e,
      alpha: 0.08,
    });
  });

  it('réduit l’opacité quand les parts somment à moins de 100 %', () => {
    const mixed = parseRgba('color-mix(in srgb, #ffffff 20%, #000000 30%)');
    expect(mixed.alpha).toBeCloseTo(0.5, 10);
    expect(mixed.red).toBeCloseTo(102, 10);
  });

  it('résout un mélange imbriqué', () => {
    expect(
      parseRgba('color-mix(in srgb, color-mix(in srgb, #000000, #ffffff) 50%, #ffffff)').red,
    ).toBeCloseTo(191.25, 10);
  });

  it('refuse par son nom un espace qu’il ne calcule pas', () => {
    expect(() => parseRgba('color-mix(in oklab, #000000, #ffffff)')).toThrow(
      /color-mix\(in oklab\).*non pris en charge/,
    );
  });

  it('refuse des parts invalides plutôt que de deviner', () => {
    expect(() => parseRgba('color-mix(in srgb, #000 0%, #fff 0%)')).toThrow(/parts/);
    expect(() => parseRgba('color-mix(in srgb, #000 120%, #fff)')).toThrow(/parts/);
  });

  it('résout tous les jetons d’Opale, dans les deux thèmes', () => {
    for (const theme of parseThemes(opaleSource)) {
      if (theme.name === 'dark-os') continue;
      for (const name of theme.tokens.keys()) {
        const value = resolveToken(theme, name);
        if (!value.startsWith('color-mix(')) continue;
        expect(() => parseRgba(value), `${theme.name} ${name}`).not.toThrow();
      }
    }
  });

  it('mesure enfin le bord des champs, que le commentaire annonce à 4,16:1', () => {
    const light = named(parseThemes(opaleSource), 'light');
    const border = parseRgba(resolveToken(light, '--opale-field-border'));
    const hex = `rgb(${border.red}, ${border.green}, ${border.blue})`;
    expect(contrastRatio(hex, resolveToken(light, '--opale-surface'))).toBeCloseTo(4.16, 1);
  });
});
