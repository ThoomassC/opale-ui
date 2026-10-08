import { describe, expect, it } from 'vitest';

import { declaration, parseRules } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';
import docV3Source from '../styles/doc-v3.css?raw';
import searchBarSource from '../opale/components/search-bar/style/SearchBar.module.scss?raw';

/* ============================================================================
   AUCUN RECTANGLE GRIS SUR UN CONTRÔLE INTÉRIEUR — RETOUR DU PROPRIÉTAIRE (08/10).

   En production, la SearchBar dessinait un rectangle gris carré à l'intérieur
   de sa pilule bleue. Le champ natif annulait bien son anneau, mais à
   spécificité ÉGALE (0,2,0) avec la règle générique de la vitrine
   `.tc-doc :focus-visible` : c'est l'ordre des feuilles qui tranchait, et le
   build de production charge le module de SearchBar AVANT la feuille de la
   vitrine. En dev, l'ordre inverse cachait le défaut.

   Deux verrous, pour que l'ordre ne décide plus rien :
   — la bibliothèque annule l'anneau de ses contrôles intérieurs à 0,3,0, ce
     qui protège aussi une application hôte qui pose son propre anneau
     universel (`.app :focus-visible`) ;
   — la vitrine exclut ces mêmes contrôles de son anneau générique.
   ========================================================================== */

/** Les contrôles natifs enveloppés : leur coquille, leur marque ou leur
    poignée porte le repère de focus, jamais la boîte native. */
const INNER = [
  '.opale-input-shell .opale-input:focus-visible',
  '.opale-input-shell .opale-select:focus-visible',
  '.opale-multiselect .opale-multiselect__list:focus-visible',
  '.opale-range-field .opale-range:focus-visible',
  '.opale-svg-map .opale-svg-map__region:focus-visible',
  '.opale-dropzone .opale-visually-hidden:focus-visible',
  '.opale-checkbox-row .opale-checkbox:focus-visible',
  '.opale-toggle-row .opale-toggle:focus-visible',
  '.opale-radio-row .opale-radio:focus-visible',
];

describe('les contrôles intérieurs, côté bibliothèque', () => {
  it('le champ de SearchBar n’a ni anneau ni ombre, à spécificité 0,3,0', () => {
    expect(declaration(searchBarSource, '.searchBar .input:focus-visible', 'outline')).toBe('none');
    expect(declaration(searchBarSource, '.searchBar .input:focus-visible', 'box-shadow')).toBe(
      'none',
    );
  });

  it.each(INNER)('%s n’a ni anneau ni ombre, à spécificité 0,3,0', (selector) => {
    expect(declaration(opaleSource, selector, 'outline')).toBe('none');
    expect(declaration(opaleSource, selector, 'box-shadow')).toBe('none');
  });
});

/** Le sélecteur brut de la règle qui cite TOUTES ces pièces, retours à la
    ligne compris : Prettier coupe les longues listes `:is()`. */
function selectorWith(source: string, parts: readonly string[]): string {
  const found = parseRules(source)
    .flatMap((rule) => rule.selectors)
    .find((selector) => {
      const flat = selector.replace(/\s+/g, ' ');
      return parts.every((part) => flat.includes(part));
    });
  expect(found, `aucune règle ne cite ${parts.join(', ')}`).toBeDefined();
  return found as string;
}

describe('les contrôles intérieurs, côté vitrine', () => {
  it('les exclut de l’anneau générique de la vitrine', () => {
    const selector = selectorWith(docV3Source, [
      '.tc-doc :is(',
      '.opale-input,',
      '.opale-select,',
      '.opale-multiselect__list,',
      '.opale-search-bar__input,',
      '.opale-range,',
      '.opale-svg-map__region,',
      '.opale-checkbox,',
      '.opale-toggle,',
      '.opale-radio,',
      '.opale-dropzone .opale-visually-hidden',
      '):focus-visible',
    ]);
    expect(declaration(docV3Source, selector, 'outline')).toBe('none');
    expect(declaration(docV3Source, selector, 'box-shadow')).toBe('none');
  });
});

/* Les éléments de la vitrine qui gardent un anneau le portent arrondi : le
   pied de page, les blocs dépliables des notes de version, les liens légaux
   de la démo et les contrôles natifs du vérificateur de marque traçaient
   encore un rectangle. */
describe('les anneaux restants de la vitrine', () => {
  it('épousent un coin arrondi', () => {
    const selector = selectorWith(docV3Source, [
      '.tc-doc-footer__link,',
      '.tc-doc summary,',
      '.opale-legal-links a,',
      "input[type='color']",
      '):focus-visible',
    ]);
    expect(declaration(docV3Source, selector, 'border-radius')).toBe('0.5rem');
    expect(
      declaration(docV3Source, ".tc-doc input[type='radio']:focus-visible", 'border-radius'),
    ).toBe('50%');
  });
});
