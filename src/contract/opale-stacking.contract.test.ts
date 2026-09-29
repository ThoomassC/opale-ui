import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import { declaration, declarations, stripComments } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   UNE SEULE ÉCHELLE D'EMPILEMENT, UN SEUL VOILE.

   Les plans globaux — barre collante, liste déroulante, bandeau, dialogue,
   message — prennent leur rang dans `--opale-z-*`, dans cet ordre. Seuls les
   petits entiers (−2 à 3) restent littéraux : ils ordonnent les couches
   internes d'un composant, dans son propre contexte d'empilement.

   Un dialogue voile la page avec `--opale-scrim`, couleur et flou compris.
   ========================================================================== */

const modules = import.meta.glob<string>('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sheets: Record<string, string> = { 'opale.css': opaleSource, ...modules };
const SCALE = ['sticky', 'popover', 'overlay', 'modal', 'toast'] as const;
const modal = modules['../opale/components/modal/style/Modal.module.css'];

describe('l’échelle d’empilement', () => {
  const root = declarations(opaleSource, ':root');

  it('déclare les cinq plans à la racine, dans l’ordre', () => {
    const values = SCALE.map((step) => Number(root.get(`--opale-z-${step}`)));
    expect(values).toEqual([20, 50, 900, 1000, 1100]);
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const name = file.replace('../opale/components/', '');
    it(`${name} ne pose de rang global que par l’échelle`, () => {
      postcss.parse(stripComments(raw)).walkDecls('z-index', (decl) => {
        const value = decl.value.trim();
        if (/^-?\d+$/.test(value)) {
          expect(Math.abs(Number(value)), `${decl.parent?.toString().split('{')[0]}`).toBeLessThanOrEqual(3);
        } else {
          expect(value).toMatch(/^var\(--opale-z-(sticky|popover|overlay|modal|toast)\)$/);
        }
      });
    });
  }

  it.each([
    ['.container', 'modal', modules['../opale/components/modal/style/Modal.module.css']],
    ['.root', 'toast', modules['../opale/components/toast/style/Toast.module.css']],
    ['.opale-toast-anchor', 'toast', opaleSource],
    ['.opale-cookie-banner-anchor', 'overlay', opaleSource],
    ['.opale-dialog-backdrop', 'modal', opaleSource],
    ['.languageList', 'popover', modules['../opale/components/header-controls/HeaderControls.module.css']],
    ['.stickyHeader', 'sticky', modules['../opale/components/page-scaffold/PageScaffold.module.css']],
    ['.bar', 'sticky', modules['../opale/components/site-nav/site-nav.module.css']],
    ['.glassRoot', 'sticky', modules['../opale/components/site-nav/site-nav.module.css']],
  ])('%s prend le plan « %s »', (selector, step, source) => {
    expect(declaration(source, selector, 'z-index')).toBe(`var(--opale-z-${step})`);
  });
});

describe('le voile des dialogues', () => {
  it('est un jeton unique, couleur et flou', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-scrim')).toBe('rgb(12 15 13 / 0.62)');
    expect(root.get('--opale-scrim-blur')).toBe('3px');
  });

  it('habille la modale et l’ancien fond de dialogue de la même façon', () => {
    const overlay = declarations(modal, '.overlay');
    expect(overlay.get('background')).toBe('var(--opale-modal-scrim, var(--opale-scrim))');
    expect(overlay.get('backdrop-filter')).toBe('blur(var(--opale-scrim-blur))');

    const backdrop = declarations(opaleSource, '.opale-dialog-backdrop');
    expect(backdrop.get('background')).toBe('var(--opale-scrim)');
    expect(backdrop.get('backdrop-filter')).toBe('blur(var(--opale-scrim-blur))');
  });
});
