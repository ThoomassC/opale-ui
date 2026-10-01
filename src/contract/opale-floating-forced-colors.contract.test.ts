import { describe, expect, it } from 'vitest';

import { declarations } from '../test/css-rules';
import menuSource from '../opale/components/dropdown-menu/style/DropdownMenu.module.css?raw';

/* ============================================================================
   L'ÉLÉMENT FOCALISÉ D'UN MENU RESTE LISIBLE EN CONTRASTES FORCÉS.

   Sans `forced-color-adjust: none`, Chromium pose sa plaque Canvas derrière le
   libellé : l'encre HighlightText y disparaît et l'utilisateur au clavier ne
   lit plus l'élément courant (vérification 2.10.0).
   ========================================================================== */

const FORCED = '@media (forced-colors: active)';

describe('DropdownMenu — contrastes forcés', () => {
  it('peint l’élément focalisé aux couleurs de sélection, sans plaque du navigateur', () => {
    const focused = declarations(menuSource, '.item:focus', { within: FORCED });
    expect(focused.get('background')).toBe('Highlight');
    expect(focused.get('color')).toBe('HighlightText');
    expect(focused.get('forced-color-adjust')).toBe('none');
  });
});
