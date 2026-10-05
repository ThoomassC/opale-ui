import { describe, expect, it } from 'vitest';

import { layerSheet, stripFontsImport, topLevelLayers, SHEET_VARIANTS } from '../scripts/css-variants.mjs';
import manifest from '../package.json';

/* =============================================================================
   LES QUATRE FEUILLES LIVRÉES, DÉRIVÉES D'UNE SEULE.

   THM-08 — une feuille hors couche bat toute règle en couche : les utilitaires
   de Tailwind v4, rangés dans `@layer utilities`, perdaient toujours face à
   Opale. `opale.layered.css` range la même feuille dans `@layer opale`.
   THM-16 — `opale-nofonts.css` est la même feuille sans l'`@import` des polices.
   `opale.css` reste inchangée : personne n'a de code à modifier.
   ========================================================================== */

const SHEET = `@charset "UTF-8";\n@import './fonts.css';\n:root{--opale-primary:#123}.a{color:red}\n/*$vite$:1*/`;

describe('scripts/css-variants.mjs', () => {
  it('range la feuille dans une seule couche, @charset et @import restant devant', () => {
    const layered = layerSheet(SHEET);
    expect(layered.startsWith(`@charset "UTF-8";\n@import './fonts.css';\n@layer opale{`)).toBe(true);
    expect(layered).toContain(':root{--opale-primary:#123}.a{color:red}');
    expect(topLevelLayers(layered)).toEqual(['opale']);
    expect(layered.trimEnd().endsWith('}')).toBe(true);
  });

  it('retire l’@import des polices, et rien d’autre', () => {
    const bare = stripFontsImport(SHEET);
    expect(bare).not.toContain('fonts.css');
    expect(bare).toBe(`@charset "UTF-8";\n:root{--opale-primary:#123}.a{color:red}\n/*$vite$:1*/`);
    expect(topLevelLayers(layerSheet(bare))).toEqual(['opale']);
  });

  it('refuse une feuille dont un @import tomberait dans la couche', () => {
    expect(() => layerSheet(`.a{}\n@import './x.css';`)).toThrow(/@import/);
  });

  it('refuse une feuille déjà en couche', () => {
    expect(() => layerSheet('@layer x{.a{}}')).toThrow(/@layer/);
  });

  it('ne compte pas une accolade dans une chaîne ou un commentaire', () => {
    expect(topLevelLayers('@layer opale{.a::before{content:"}"}/* } */}')).toEqual(['opale']);
    expect(topLevelLayers('@layer opale{.a{}}.b{}')).toEqual(['opale', null]);
  });

  it('exporte chaque variante déclarée par le paquet', () => {
    for (const variant of SHEET_VARIANTS) {
      expect(manifest.exports).toHaveProperty(`./${variant}`, `./dist/opale/${variant}`);
    }
    expect(manifest.exports).toHaveProperty('./opale.css', './dist/opale/opale.css');
  });

  /* LA CHARTE `--tc-*` N'EST PLUS PUBLIÉE (4.0.0). `src/tokens` reste la charte
     interne de la vitrine et des contrats ; le seul contrat public de couleur
     est `--opale-*`, porté par `opale.css`. */
  it('ne publie plus ./tokens.css', () => {
    expect(manifest.exports).not.toHaveProperty('./tokens.css');
    expect(Object.values(manifest.exports).join(' ')).not.toContain('dist/tokens');
    expect(manifest.scripts).not.toHaveProperty('build:css');
    expect(manifest.scripts['build:lib']).not.toContain('build:css');
  });
});
