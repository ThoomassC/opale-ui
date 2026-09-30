import { describe, expect, it } from 'vitest';

import * as glyphs from './glyphs';
import { OPALE_ICONS, isOpaleIconName } from './icons';

/* =============================================================================
   UNE SEULE SOURCE PAR DESSIN.

   `glyphs.ts` isole les tracés que les composants dessinent eux-mêmes, pour
   qu'une application n'embarque pas le catalogue entier. Le risque d'une telle
   séparation est la dérive : la croix de `Modal` retouchée ici et pas dans le
   catalogue, et la page « Icônes » montrerait un dessin que le dialogue
   n'affiche plus. Le catalogue reprend donc les constantes elles-mêmes, et ce
   fichier vérifie que c'est bien le même objet — pas une copie égale.
   ========================================================================== */

/** `GLYPH_ALERT_TRIANGLE` → `alert-triangle`. */
const iconNameOf = (constant: string): string =>
  constant
    .replace(/^GLYPH_/, '')
    .toLowerCase()
    .replaceAll('_', '-');

const entries = Object.entries(glyphs).filter(([key]) => key.startsWith('GLYPH_'));

/** Le cercle du catalogue, écrit comme `circle()` l'écrit dans `icons.ts`. */
const circle = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

describe('les tracés isolés', () => {
  it('devraient exister — sinon rien ne justifie le module', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s devrait porter le nom d’une icône du jeu', (constant) => {
    expect(isOpaleIconName(iconNameOf(constant))).toBe(true);
  });

  it.each(entries)('%s devrait être l’objet même du catalogue', (constant, paths) => {
    const name = iconNameOf(constant);
    if (!isOpaleIconName(name)) throw new Error(`${constant} ne nomme aucune icône`);

    expect(OPALE_ICONS[name]).toBe(paths);
  });

  /* LE CERCLE EST RECOPIÉ EN CLAIR, pour que le module ne contienne aucun
     appel (voir l'en-tête de `glyphs.ts`). Cette recopie ne doit pas changer le
     dessin d'un iota. */
  it.each([
    ['GLYPH_INFO', glyphs.GLYPH_INFO],
    ['GLYPH_CHECK_CIRCLE', glyphs.GLYPH_CHECK_CIRCLE],
    ['GLYPH_X_CIRCLE', glyphs.GLYPH_X_CIRCLE],
  ])('%s devrait dessiner le cercle du jeu', (_constant, paths) => {
    expect(paths[0]).toBe(circle(12, 12, 8.5));
  });
});
