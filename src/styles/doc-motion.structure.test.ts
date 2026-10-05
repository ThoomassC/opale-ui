import { describe, expect, it } from 'vitest';

import { declarations } from '../test/css-rules';
import docSource from './doc-v3.css?raw';

/* =============================================================================
   LE MOUVEMENT RÉDUIT DE LA VITRINE GARDE SES 160 MS DE COULEUR.

   La page Accessibilité promet qu'en mouvement réduit le retour de couleur
   reste là. `tokens.css` le tient sur `*` (poids nul) ; le filet de la vitrine,
   sur `.tc-doc *`, l'écrasait en ramenant toutes les transitions à 0,01 ms.
   Il ne restreint plus que la liste des propriétés : les animations sautent,
   les déplacements aussi, la couleur et l'opacité gardent leur durée.
   ========================================================================== */

describe('le mouvement réduit de la vitrine', () => {
  const REDUCED = '@media (prefers-reduced-motion: reduce)';

  for (const selector of ['.tc-doc', '.tc-doc *', '.tc-doc *::before', '.tc-doc *::after']) {
    it(`borne les animations et garde la couleur sur ${selector}`, () => {
      const filet = declarations(docSource, selector, { within: REDUCED });

      expect(filet.get('animation-duration')).toBe('0.01ms !important');
      expect(filet.get('animation-iteration-count')).toBe('1 !important');
      expect(filet.get('transition-property')).toBe(
        'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity !important',
      );
      expect(filet.has('transition-duration'), 'La durée doit rester celle de la règle.').toBe(
        false,
      );
    });
  }
});
