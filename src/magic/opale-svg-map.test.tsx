import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { compositeOver, contrastRatio, withAlpha } from '../contract/color';
import { parseThemes, resolveToken, ruleBodies, stripComments } from '../contract/stylesheet';
import type { Theme } from '../contract/stylesheet';
import { useSvgMapViewport } from './components';
import opaleSource from './opale.css?raw';
import { SvgMap, SvgMapControls, type SvgMapRegion } from './opale';

afterEach(cleanup);

const REGIONS: readonly SvgMapRegion[] = [
  { id: 'a', path: 'M0 0 H100 V100 H0 Z', name: 'Alpha' },
  { id: 'b', path: 'M100 0 H200 V100 H100 Z', name: 'Bêta' },
  { id: 'c', path: 'M300 100 H400 V200 H300 Z', ariaLabel: 'Zone secrète' },
];

const svgOf = (container: HTMLElement) => container.querySelector('svg') as SVGSVGElement;

describe('SvgMap', () => {
  describe('carte illustrative', () => {
    it('est une image nommée, dont les régions ne sont pas des contrôles', () => {
      render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} label="Trois zones" />);

      expect(screen.getByRole('img', { name: 'Trois zones' })).toBeInTheDocument();
      expect(screen.queryAllByRole('button', { name: /Alpha|Bêta/ })).toHaveLength(0);
    });

    it('peint une région par tracé, avec la couleur que l’appelant calcule', () => {
      const { container } = render(
        <SvgMap
          viewBox="0 0 400 200"
          regions={REGIONS}
          fill={(id) => (id === 'b' ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 255)')}
        />,
      );

      const paths = container.querySelectorAll('[data-region-id]');
      expect(paths).toHaveLength(3);
      expect((paths[1] as SVGPathElement).style.fill).toBe('rgb(255, 0, 0)');
    });
  });

  describe('carte sélectionnable', () => {
    it('devient un groupe, dont chaque région est un bouton nommé', () => {
      render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} selectable label="Zones" />);

      expect(screen.getByRole('group', { name: 'Zones' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
      /* `ariaLabel` l'emporte sur `name`, et un tracé sans nom retombe sur son
         identifiant — mieux vaut un nom pauvre qu'un bouton muet. */
      expect(screen.getByRole('button', { name: 'Zone secrète' })).toBeInTheDocument();
    });

    it('rend l’identifiant de la région désignée, au clic comme au clavier', () => {
      const onSelect = vi.fn();
      render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} selectable onSelect={onSelect} />);

      fireEvent.click(screen.getByRole('button', { name: 'Bêta' }));
      fireEvent.keyDown(screen.getByRole('button', { name: 'Alpha' }), { key: 'Enter' });
      fireEvent.keyDown(screen.getByRole('button', { name: 'Alpha' }), { key: ' ' });

      expect(onSelect.mock.calls.map(([id]) => id)).toEqual(['b', 'a', 'a']);
    });

    /* UN SEUL ARRÊT DE TABULATION. Cent départements dans l'ordre de
       tabulation, ce sont cent pressions de Tab pour sortir de la carte. */
    it('ne place qu’une région dans l’ordre de tabulation, et les flèches suivent la géographie', () => {
      render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} selectable />);

      const [alpha, beta, secret] = ['Alpha', 'Bêta', 'Zone secrète'].map((name) =>
        screen.getByRole('button', { name }),
      );
      expect([alpha, beta, secret].map((el) => el.getAttribute('tabindex'))).toEqual([
        '0',
        '-1',
        '-1',
      ]);

      alpha.focus();
      fireEvent.keyDown(alpha, { key: 'ArrowRight' });
      expect(beta).toHaveFocus();
      expect(beta).toHaveAttribute('tabindex', '0');

      /* Sans voisine à droite, le focus reste : « droite » mène à droite ou
         nulle part, jamais au début de la liste. */
      fireEvent.keyDown(beta, { key: 'End' });
      expect(secret).toHaveFocus();
      fireEvent.keyDown(secret, { key: 'ArrowRight' });
      expect(secret).toHaveFocus();
      fireEvent.keyDown(secret, { key: 'ArrowLeft' });
      expect(beta).toHaveFocus();
      fireEvent.keyDown(beta, { key: 'Home' });
      expect(alpha).toHaveFocus();
    });

    it('annonce les régions retenues quand l’appelant en tient la liste', () => {
      render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} selectable selected={['b']} />);

      expect(screen.getByRole('button', { name: 'Bêta' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('n’annonce aucun état pressé quand l’appelant ne tient pas de sélection', () => {
      render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} selectable />);

      expect(screen.getByRole('button', { name: 'Alpha' })).not.toHaveAttribute('aria-pressed');
    });
  });

  describe('gestes', () => {
    /* Un glissement se termine toujours sur une région : sans seuil, se
       déplacer vaudrait réponse. */
    it('avale le clic qui termine un glissement au-delà de la tolérance', () => {
      vi.useFakeTimers();
      const onSelect = vi.fn();
      const { container } = render(
        <SvgMap viewBox="0 0 400 200" regions={REGIONS} selectable onSelect={onSelect} />,
      );
      const svg = svgOf(container);
      const beta = screen.getByRole('button', { name: 'Bêta' });

      fireEvent.pointerDown(svg, { button: 0, clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent.pointerMove(window, { clientX: 40, clientY: 10, pointerId: 1 });
      fireEvent.pointerUp(window, { clientX: 40, clientY: 10, pointerId: 1 });
      fireEvent.click(beta);
      expect(onSelect).not.toHaveBeenCalled();

      act(() => {
        vi.runAllTimers();
      });
      fireEvent.pointerDown(svg, { button: 0, clientX: 10, clientY: 10, pointerId: 2 });
      fireEvent.pointerMove(window, { clientX: 13, clientY: 11, pointerId: 2 });
      fireEvent.pointerUp(window, { clientX: 13, clientY: 11, pointerId: 2 });
      fireEvent.click(beta);
      expect(onSelect).toHaveBeenCalledWith('b');
      vi.useRealTimers();
    });

    /* Les zooms du clavier et des boutons sont ANIMÉS : la vue y arrive en
       quelques images, d'où l'attente. */
    it('zoome au clavier avec + et − et revient à la vue d’ensemble avec 0', async () => {
      const { container } = render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} selectable />);
      const svg = svgOf(container);
      const alpha = screen.getByRole('button', { name: 'Alpha' });

      fireEvent.keyDown(alpha, { key: '+' });
      await waitFor(() => expect(svg.getAttribute('viewBox')).not.toBe('0 0 400 200'));
      fireEvent.keyDown(alpha, { key: '0' });
      await waitFor(() => expect(svg.getAttribute('viewBox')).toBe('0 0 400 200'));
    });

    it('laisse les touches d’un champ posé dans l’overlay à ce champ', () => {
      const { container } = render(
        <SvgMap
          viewBox="0 0 400 200"
          regions={REGIONS}
          selectable
          overlay={<input aria-label="Code postal" />}
        />,
      );
      const field = screen.getByRole('textbox', { name: 'Code postal' });

      const zero = fireEvent.keyDown(field, { key: '0' });
      expect(zero).toBe(true);
      expect(svgOf(container).getAttribute('viewBox')).toBe('0 0 400 200');
    });

    /* Une carte zoomée ne se parcourait qu'en la glissant (WCAG 2.1.1). */
    it('se déplace au clavier : flèches sur une carte illustrative, Maj + flèches partout', async () => {
      const { container } = render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} />);
      const svg = svgOf(container);

      expect(svg).toHaveAttribute('tabindex', '0');
      fireEvent.keyDown(svg, { key: '+' });
      await waitFor(() => expect(svg.getAttribute('viewBox')).not.toBe('0 0 400 200'));
      await new Promise((resolve) => setTimeout(resolve, 350));
      const zoomed = svg.getAttribute('viewBox');

      fireEvent.keyDown(svg, { key: 'ArrowRight' });
      expect(svg.getAttribute('viewBox')).not.toBe(zoomed);
    });

    it('ferme l’infobulle avec Échap', () => {
      render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} selectable />);
      const alpha = screen.getByRole('button', { name: 'Alpha' });

      fireEvent.focus(alpha);
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      fireEvent.keyDown(alpha, { key: 'Escape' });
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    });

    it('laisse défiler la page sous une molette nue, et le dit', () => {
      const { container } = render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} />);
      const svg = svgOf(container);

      const bare = new WheelEvent('wheel', { deltaY: -100, cancelable: true, bubbles: true });
      act(() => {
        svg.dispatchEvent(bare);
      });
      expect(bare.defaultPrevented).toBe(false);
      expect(svg.getAttribute('viewBox')).toBe('0 0 400 200');
      expect(screen.getByText(/Ctrl.*molette|⌘.*molette/)).toBeInTheDocument();

      const modified = new WheelEvent('wheel', {
        deltaY: -100,
        ctrlKey: true,
        cancelable: true,
        bubbles: true,
      });
      act(() => {
        svg.dispatchEvent(modified);
      });
      expect(modified.defaultPrevented).toBe(true);
      expect(svg.getAttribute('viewBox')).not.toBe('0 0 400 200');
    });
  });

  describe('vue pilotée de l’extérieur', () => {
    function Framed() {
      const viewport = useSvgMapViewport('0 0 400 200', { maxZoom: 9 });
      return (
        <>
          <button
            type="button"
            onClick={() => viewport.fitTo(['c'], { padding: 0, animate: false })}
          >
            Cadrer
          </button>
          <SvgMap viewBox="0 0 400 200" regions={REGIONS} viewport={viewport} controls={false} />
          <output>{viewport.current}</output>
        </>
      );
    }

    /* Un continent n'est pas l'union de ses pays : la France du jeu mondial
       emporte la Guyane, la Russie va jusqu'au Pacifique. On cadre alors sur
       une zone du dessin. */
    it('cadre sur une zone du dessin, indépendamment des régions', () => {
      function Zone() {
        const viewport = useSvgMapViewport('0 0 400 200');
        return (
          <>
            <button
              type="button"
              onClick={() =>
                viewport.fitBounds(
                  { minX: 0, minY: 0, maxX: 100, maxY: 50 },
                  { padding: 0, animate: false },
                )
              }
            >
              Zone
            </button>
            <SvgMap viewBox="0 0 400 200" regions={REGIONS} viewport={viewport} controls={false} />
          </>
        );
      }
      const { container } = render(<Zone />);

      fireEvent.click(screen.getByRole('button', { name: 'Zone' }));

      expect(svgOf(container).getAttribute('viewBox')).toBe('0 0 100 50');
    });

    it('cadre sur un ensemble de régions en gardant le rapport de la carte', () => {
      const { container } = render(<Framed />);

      fireEvent.click(screen.getByRole('button', { name: 'Cadrer' }));

      /* Centrée, la vue irait de 250 à 450 : elle sortirait du dessin, et
         `clampView` la ramène au bord droit. */
      expect(svgOf(container).getAttribute('viewBox')).toBe('200 100 200 100');
      expect(screen.getByRole('status')).toHaveTextContent('200 100 200 100');
    });
  });

  describe('commandes', () => {
    it('zoome, dézoome et revient, sans jamais retirer un bouton qui a le focus', async () => {
      const { container } = render(<SvgMap viewBox="0 0 400 200" regions={REGIONS} />);
      const svg = svgOf(container);
      const reset = screen.getByRole('button', { name: 'Vue d’ensemble' });
      const zoomOut = screen.getByRole('button', { name: 'Dézoomer' });

      /* En vue d'ensemble, « revenir » et « dézoomer » ne feraient rien : ils
         le disent, mais restent là — un bouton qui disparaît sous le focus
         jette le clavier en haut de la page. */
      expect(reset).toHaveAttribute('aria-disabled', 'true');
      expect(zoomOut).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));
      await waitFor(() => expect(reset).not.toHaveAttribute('aria-disabled'));
      expect(svg.getAttribute('viewBox')).not.toBe('0 0 400 200');
    });

    it('se branche aussi à part, sur une vue partagée', async () => {
      function Detached() {
        const viewport = useSvgMapViewport('0 0 400 200');
        return (
          <>
            <SvgMapControls viewport={viewport} />
            <output>{viewport.zoomed ? 'zoomée' : 'ensemble'}</output>
          </>
        );
      }
      render(<Detached />);

      fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('zoomée'));
    });
  });
});

/* =============================================================================
   LE DÉCOUPAGE SE VOIT.

   Sur une carte, le contour EST l'information : c'est lui qui dit où finit un
   département. Un objet graphique porteur de sens doit tenir 3:1 contre ce qui
   l'entoure (WCAG 1.4.11). La référence dont ce composant s'inspire posait le
   filet de séparation des surfaces, qui plafonne à 1,47:1 en thème sombre.
   ========================================================================== */
/* =============================================================================
   LE DESSIN NE TOUCHE PAS LES COINS ARRONDIS.

   Un dessin cartographique remplit son viewBox jusqu'aux bords : la Corse est
   dans le coin inférieur droit de la France de svg-maps, la pointe de la
   Bretagne sur le bord gauche. Posée dans une plaque arrondie qui rogne ce qui
   dépasse, la carte perdait ses coins — la Corse amputée —, et l'anneau de
   focus, tracé sur le `<svg>` rectangulaire, s'arrêtait net aux arrondis.
   ========================================================================== */
describe('SvgMap — les coins de la plaque', () => {
  const css = stripComments(opaleSource);

  it('écarte le dessin des coins arrondis par un coussin de la plaque', () => {
    expect(ruleBodies(css, '.opale-svg-map__plate').join('\n')).toMatch(
      /(^|[;{\s])padding:\s*var\(--opale-space-sm\)/,
    );
  });

  it('trace l’anneau de focus sur la plaque, qui suit ses arrondis, et non sur le svg', () => {
    expect(ruleBodies(css, '.opale-svg-map__svg:focus-visible').join('')).not.toMatch(
      /outline:\s*3px/,
    );
    expect(
      ruleBodies(css, '.opale-svg-map__plate:has(.opale-svg-map__svg:focus-visible)').join(''),
    ).toMatch(/outline:\s*3px solid var\(--opale-focus\)/);
  });
});

describe('SvgMap — contraste du contour', () => {
  const themes = new Map<string, Theme>(parseThemes(opaleSource).map((t) => [t.name, t]));
  const body = ruleBodies(stripComments(opaleSource), '.opale-svg-map').join('\n');

  /** Lit « color-mix(in srgb, var(--a) N%, var(--b)) » dans la déclaration d'une propriété. */
  const mixOf = (property: string) => {
    const match = body.match(
      new RegExp(
        `${property}:\\s*color-mix\\(in srgb, var\\((--[\\w-]+)\\) (\\d+)%, var\\((--[\\w-]+)\\)\\)`,
      ),
    );
    expect(match, `${property} attendu en color-mix de deux jetons`).not.toBeNull();
    const [, top, share, bottom] = match as RegExpMatchArray;
    return { top, share: Number(share) / 100, bottom };
  };

  for (const name of ['light', 'dark-explicit'] as const) {
    it(`devrait tenir 3:1 entre le contour et le remplissage par défaut en ${name}`, () => {
      const theme = themes.get(name) as Theme;
      const paint = ({ top, share, bottom }: ReturnType<typeof mixOf>) =>
        compositeOver(withAlpha(resolveToken(theme, top), share), resolveToken(theme, bottom));

      const fill = paint(mixOf('--opale-svg-map-fill'));
      const stroke = paint(mixOf('--opale-svg-map-stroke'));

      expect(contrastRatio(stroke, fill)).toBeGreaterThanOrEqual(3);
    });
  }
});
