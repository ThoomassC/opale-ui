import { describe, expect, it } from 'vitest';

import { declaration, declarations } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';
import tabsSource from '../opale/components/tabs/style/Tabs.module.css?raw';

/* ============================================================================
   LES ÉTATS SE VOIENT SANS LA COULEUR, AU CLAVIER, EN CONTRASTES FORCÉS ET
   DE DROITE À GAUCHE.

   Ce garde fixe les corrections de l'audit 3.9.3 qui ne peuvent vivre que dans
   la feuille : un focus sur la pagination (ACC-02), un repère non chromatique
   pour l'onglet et le segment retenus (ACC-03), des couleurs système en
   contrastes forcés (ACC-04), un focus de carte distinct de la sélection
   (ACC-11), un anneau sur la zone de défilement d'une table (ACC-13), des
   cibles de 24 px dans le fil d'Ariane (ACC-14), la poignée d'interrupteur en
   écriture de droite à gauche (ACC-20), le témoin de chargement d'un bouton
   (THM-15) et la case indéterminée (DX-12).
   ========================================================================== */

const FORCED = '@media (forced-colors: active)';
const RING = /^var\(--opale-focus-ring-width\) solid /;

describe('ACC-02 — le focus de la pagination', () => {
  it('trace l’anneau d’Opale, décalé autour de l’aplat de la page courante', () => {
    const ring = declarations(opaleSource, '.opale-pagination button:focus-visible');
    expect(ring.get('outline')).toBe('var(--opale-focus-ring-width) solid var(--opale-focus)');
    expect(ring.get('outline-offset')).toBe('var(--opale-focus-ring-offset)');
  });

  it('sous verre, tire l’anneau vers l’intérieur à l’encre du matériau', () => {
    const ring = declarations(opaleSource, '.opale-pagination--glass button:focus-visible');
    expect(ring.get('outline-color')).toBe('var(--opale-glass-ink)');
    expect(ring.get('outline-offset')).toBe('calc(var(--opale-focus-ring-width) * -1)');
  });
});

describe('ACC-03 — la sélection ne tient pas à la seule teinte', () => {
  it('souligne l’onglet retenu, sous verre comme sans', () => {
    const selected = declarations(tabsSource, ".tabsTrigger[aria-selected='true']");
    expect(selected.get('text-decoration-line')).toBe('underline');
    expect(selected.get('text-decoration-thickness')).toBe('2px');
  });

  it('cerne la pastille du segmenté d’un filet de champ', () => {
    expect(declaration(opaleSource, '.opale-segmented__indicator', 'box-shadow')).toMatch(
      /^0 0 0 1px var\(--opale-field-border\), /,
    );
  });

  it('cerne la pastille du segmenté sous verre à l’encre du matériau', () => {
    expect(
      declaration(opaleSource, '[data-opale-glass] .opale-segmented__indicator', 'box-shadow'),
    ).toBe('0 0 0 1px var(--opale-glass-ink)');
  });
});

describe('ACC-04 — contrastes forcés', () => {
  it('dessine la piste et la poignée de l’interrupteur en couleurs système', () => {
    const track = declarations(opaleSource, '.opale-toggle-track', { within: FORCED });
    expect(track.get('forced-color-adjust')).toBe('none');
    expect(track.get('border')).toBe('1px solid CanvasText');
    expect(track.get('background')).toBe('Canvas');
    expect(
      declaration(opaleSource, '.opale-toggle-thumb', 'background', { within: FORCED }),
    ).toBe('CanvasText');
    expect(
      declaration(opaleSource, '.opale-toggle:checked + * .opale-toggle-track', 'background', {
        within: FORCED,
      }),
    ).toBe('Highlight');
    expect(
      declaration(
        opaleSource,
        '.opale-toggle:checked + * .opale-toggle-track .opale-toggle-thumb',
        'background',
        { within: FORCED },
      ),
    ).toBe('HighlightText');
  });

  it('dessine la piste et la valeur de la progression', () => {
    const track = declarations(opaleSource, '.opale-progress', { within: FORCED });
    expect(track.get('border')).toBe('1px solid CanvasText');
    expect(track.get('forced-color-adjust')).toBe('none');
    expect(
      declaration(opaleSource, '[data-opale-glass] .opale-progress__value', 'background', {
        within: FORCED,
      }),
    ).toBe('Highlight');
  });

  it('garde visibles le segment, la page et l’onglet courants', () => {
    expect(
      declaration(opaleSource, '.opale-segmented__indicator', 'background', { within: FORCED }),
    ).toBe('Highlight');
    expect(
      declaration(opaleSource, ".opale-segmented__item[aria-pressed='true']", 'color', {
        within: FORCED,
      }),
    ).toBe('HighlightText');
    const page = declarations(opaleSource, ".opale-pagination button[aria-current='page']", {
      within: FORCED,
    });
    expect(page.get('background')).toBe('Highlight');
    expect(page.get('color')).toBe('HighlightText');
    expect(declaration(tabsSource, '.tabsIndicator', 'background', { within: FORCED })).toBe(
      'Highlight',
    );
  });

  it('rend un anneau au verre focalisé, dont le halo est une ombre effacée', () => {
    expect(
      declaration(opaleSource, '[data-opale-glass]:has(:focus-visible)', 'outline', {
        within: FORCED,
      }),
    ).toMatch(RING);
    expect(
      declaration(opaleSource, '.opale-toggle:focus-visible + [data-opale-glass]', 'outline', {
        within: FORCED,
      }),
    ).toMatch(RING);
  });
});

describe('ACC-11 — le focus d’une région de carte n’est pas sa sélection', () => {
  it('tire le focus en tirets, la sélection en trait plein', () => {
    expect(declaration(opaleSource, '.opale-svg-map__focus', 'stroke-dasharray')).toMatch(
      /^\d+(\.\d+)? \d+(\.\d+)?$/,
    );
    expect(declaration(opaleSource, '.opale-svg-map__selected', 'stroke-dasharray')).toBe(
      undefined,
    );
  });
});

describe('ACC-13 — la zone de défilement d’une table', () => {
  it('porte l’anneau d’Opale quand elle reçoit le focus', () => {
    expect(declaration(opaleSource, '.opale-table-scroll:focus-visible', 'outline')).toBe(
      'var(--opale-focus-ring-width) solid var(--opale-focus)',
    );
  });
});

describe('ACC-14 — les cibles du fil d’Ariane', () => {
  it.each(['.opale-breadcrumb a', '.opale-legal-links a'])('%s mesure 24 px de haut', (sel) => {
    const link = declarations(opaleSource, sel);
    expect(link.get('display')).toBe('inline-flex');
    expect(link.get('min-block-size')).toBe('1.5rem');
  });
});

describe('ACC-20 — l’interrupteur de droite à gauche', () => {
  it('pose la poignée par une marge logique', () => {
    const thumb = declarations(opaleSource, '.opale-toggle-thumb');
    expect(thumb.get('margin-inline-start')).toBe('0.25rem');
    expect(thumb.has('margin-left')).toBe(false);
  });

  it.each([
    '.opale-toggle:checked + .opale-toggle-track .opale-toggle-thumb',
    '.opale-toggle:checked + * .opale-toggle-track .opale-toggle-thumb',
  ])('%s glisse dans le sens de l’écriture', (selector) => {
    expect(declaration(opaleSource, selector, 'transform')).toBe(
      'translateX(calc(1.5rem * var(--opale-inline-direction, 1)))',
    );
  });

  it('inverse le sens sous :dir(rtl)', () => {
    expect(declaration(opaleSource, '.opale-toggle-thumb:dir(rtl)', '--opale-inline-direction')).toBe(
      '-1',
    );
  });
});

describe('THM-15 et ACC-09 — le bouton en chargement', () => {
  it('peint son témoin à l’encre du bouton', () => {
    const spinner = declarations(opaleSource, '.opale-button .opale-spinner');
    expect(spinner.get('border-color')).toBe('color-mix(in srgb, currentColor 30%, transparent)');
    expect(spinner.get('border-top-color')).toBe('currentColor');
    expect(spinner.get('width')).toBe('1em');
    expect(spinner.get('height')).toBe('1em');
  });

  it('garde l’aspect inactif, avec un curseur d’attente', () => {
    const busy = declarations(opaleSource, ".opale-button[aria-busy='true']");
    expect(busy.get('cursor')).toBe('progress');
    expect(busy.get('opacity')).toBe('var(--opale-disabled-opacity)');
  });
});

describe('DX-12 — la case indéterminée', () => {
  it.each([
    '.opale-checkbox:indeterminate + .opale-checkbox-mark::before',
    '.opale-checkbox:indeterminate + * .opale-checkbox-mark::before',
  ])('%s dessine un tiret', (selector) => {
    expect(declaration(opaleSource, selector, 'content')).toBe("'−'");
  });
});
