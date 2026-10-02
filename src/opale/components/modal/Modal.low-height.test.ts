import { describe, expect, it } from 'vitest';
import sheet from './style/Modal.module.css?raw';
import { declaration } from '../../../test/css-rules';

/* 3. RETOUR DE GRAND ORAL STUDIO : à 640 × 360 (zoom 200 %) et texte à 125 %,
      le corps d'un SidePanel ne gardait que 55 px : les marges en rem de la
      fenêtre, du panneau, de l'en-tête et du pied prenaient toute la hauteur.
      Sous 30 rem de haut, elles se resserrent. */
describe('Modal et SidePanel en faible hauteur', () => {
  const low = { within: '@media (max-height: 30rem)' };

  it('resserre les marges de la fenêtre et du panneau', () => {
    expect(declaration(sheet, '.container', 'padding-block', low)).toBe('var(--opale-space-xs)');
    expect(declaration(sheet, '.panel', 'padding', low)).toBe('var(--opale-space-sm)');
  });

  it('resserre l’en-tête et le pied', () => {
    expect(declaration(sheet, '.header:has(.heading)', 'padding-bottom', low)).toBe(
      'var(--opale-space-sm)',
    );
    expect(declaration(sheet, '.body', 'margin-top', low)).toBe('var(--opale-space-sm)');
    expect(declaration(sheet, '.footer', 'margin-top', low)).toBe('var(--opale-space-sm)');
    expect(declaration(sheet, '.body + .footer', 'padding-top', low)).toBe('var(--opale-space-sm)');
  });
});
