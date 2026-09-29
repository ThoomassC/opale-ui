import { describe, expect, it } from 'vitest';

import { declaration, declarations } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';
import searchBarSource from '../opale/components/search-bar/style/SearchBar.module.scss?raw';

/* ============================================================================
   UNE SEULE ÉCHELLE DE HAUTEURS POUR LES CONTRÔLES.

   Bouton 2,75 rem, champ et select 3 rem, SearchBar 44 px, bouton-icône et
   pagination chacun leur valeur : un bouton posé à côté d'un champ dépassait
   de 4 px dans tout formulaire en ligne.
   ========================================================================== */

const rule = (selector: string) => declarations(opaleSource, selector);

describe('les hauteurs des contrôles', () => {
  it('déclarent l’échelle à la racine', () => {
    const root = rule(':root');
    expect(root.get('--opale-control-sm')).toBe('2.25rem');
    expect(root.get('--opale-control-md')).toBe('2.75rem');
    expect(root.get('--opale-control-lg')).toBe('3rem');
  });

  it.each([
    ['.opale-button', 'min-height', 'md'],
    ['.opale-button--small', 'min-height', 'sm'],
    ['.opale-button--large', 'min-height', 'lg'],
    ['.opale-input-shell', 'min-height', 'md'],
    ['.opale-icon-action-button', '--opale-icon-action-size', 'md'],
    ['.opale-icon-action-button.opale-button--small', '--opale-icon-action-size', 'sm'],
    ['.opale-icon-action-button.opale-button--large', '--opale-icon-action-size', 'lg'],
    ['.opale-pagination button', 'min-block-size', 'md'],
  ])('%s prend sa hauteur dans l’échelle', (selector, property, step) => {
    expect(rule(selector).get(property)).toBe(`var(--opale-control-${step})`);
  });

  it('mesure la coquille du champ bordure comprise', () => {
    expect(rule('.opale-input-shell').get('box-sizing')).toBe('border-box');
    expect(rule('.opale-input').get('align-self')).toBe('stretch');
  });

  it('aligne SearchBar sur la même échelle', () => {
    expect(declaration(searchBarSource, '.searchBar', 'min-height')).toBe(
      'var(--opale-control-md)',
    );
  });
});
