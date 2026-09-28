import { describe, expect, it } from 'vitest';

import { ruleBodies, stripComments } from './stylesheet';
import opaleSource from '../magic/opale.css?raw';
import searchBarSource from '../magic/components/search-bar/style/SearchBar.module.scss?raw';

/* ============================================================================
   UNE SEULE ÉCHELLE DE HAUTEURS POUR LES CONTRÔLES.

   Bouton 2,75 rem, champ et select 3 rem, SearchBar 44 px, bouton-icône et
   pagination chacun leur valeur : un bouton posé à côté d'un champ dépassait
   de 4 px dans tout formulaire en ligne.
   ========================================================================== */

const css = stripComments(opaleSource);
const rule = (selector: string) => ruleBodies(css, selector).join('\n');

describe('les hauteurs des contrôles', () => {
  it('déclarent l’échelle à la racine', () => {
    const root = ruleBodies(css, ':root').join('\n');
    expect(root).toMatch(/--opale-control-sm:\s*2\.25rem/);
    expect(root).toMatch(/--opale-control-md:\s*2\.75rem/);
    expect(root).toMatch(/--opale-control-lg:\s*3rem/);
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
    expect(rule(selector)).toMatch(new RegExp(`${property}:\\s*var\\(--opale-control-${step}\\)`));
  });

  it('mesure la coquille du champ bordure comprise', () => {
    expect(rule('.opale-input-shell')).toMatch(/box-sizing:\s*border-box/);
    expect(rule('.opale-input')).toMatch(/align-self:\s*stretch/);
  });

  it('aligne SearchBar sur la même échelle', () => {
    expect(stripComments(searchBarSource)).toMatch(/min-height:\s*var\(--opale-control-md\)/);
  });
});
