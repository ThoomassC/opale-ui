import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { compositeOver, contrastRatio, withAlpha } from '../contract/color';
import { parseThemes, resolveToken } from '../contract/stylesheet';
import type { Theme } from '../contract/stylesheet';
import { declaration } from '../test/css-rules';
import { clearWorldDataCache } from './components/world-map/data-cache';
import { useWorldMapViewport, type WorldMapView } from './components';
import opaleSource from './opale.css?raw';
import { WorldMap, type WorldMapPin, type WorldMapProps } from './opale';

/* =============================================================================
   LA CARTE DU MONDE, SANS RÉSEAU.

   `fetch` est simulé : l'index et les niveaux 110m et 50m sont de petits
   fichiers écrits ici, en degrés entiers (quantification au degré). La
   France y est un carré de 15° × 12° autour de Paris.
   ========================================================================== */

const INDEX = {
  version: 1,
  source: { name: 'Natural Earth', version: '5.1.2' },
  lods: {
    '110m': { file: '110m.json' },
    '50m': { file: '50m.json' },
    '10m': { tileDegrees: 10, tiles: [] },
  },
};

const LEVEL = {
  v: 1,
  q: [0, 0, 1],
  bbox: [-180, -90, 180, 90],
  countries: [
    { id: 'FR', r: [[[-5, 40, 15, 0, 0, 12, -15, 0]]] },
    { id: 'JP', r: [[[130, 30, 15, 0, 0, 15, -15, 0]]] },
  ],
  coast: [[-5, 40, 15, 0, 0, 12]],
  borders: [],
};

const PINS: readonly WorldMapPin[] = [
  { id: 'paris', longitude: 2.35, latitude: 48.85, label: 'Paris' },
  { id: 'tokyo', longitude: 139.69, latitude: 35.69, label: 'Tokyo', tone: 'accent' },
  { id: 'rio', longitude: -43.2, latitude: -22.9, label: 'Rio de Janeiro' },
  { id: 'new-york', longitude: -74, latitude: 40.71, label: 'New York' },
];

interface Request {
  readonly url: string;
  readonly signal: AbortSignal | undefined;
}

/** Un réseau qui répond aux fichiers de `files` et laisse les autres en attente. */
function network(files: Record<string, unknown>, failing: readonly string[] = []) {
  const requests: Request[] = [];
  const fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    requests.push({ url, signal: init?.signal ?? undefined });
    const name = Object.keys(files).find((suffix) => url.endsWith(suffix));
    if (failing.some((suffix) => url.endsWith(suffix))) {
      return Promise.resolve(new Response('{}', { status: 500 }));
    }
    if (name) return Promise.resolve(new Response(JSON.stringify(files[name]), { status: 200 }));
    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError')),
      );
    });
  });
  vi.stubGlobal('fetch', fetch);
  return { fetch, requests };
}

const ALL_FILES = { 'v1/index.json': INDEX, 'v1/110m.json': LEVEL, 'v1/50m.json': LEVEL };

const reduceMotion = () =>
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));

/** La carte et la vue visée, lue dans un `<output>`. */
function Harness({
  initialView,
  ...props
}: Partial<WorldMapProps> & { initialView?: WorldMapView }) {
  const viewport = useWorldMapViewport({ initialView });
  const { longitude, latitude, zoom } = viewport.target;
  return (
    <>
      <WorldMap dataUrl="/world-map/v1" label="Villes" pins={PINS} viewport={viewport} {...props} />
      <output data-testid="view">
        {[longitude, latitude, zoom].map((value) => value.toFixed(2)).join(' ')}
      </output>
    </>
  );
}

const viewOf = () => screen.getByTestId('view').textContent?.split(' ').map(Number) ?? [];
const surface = () => screen.getByRole('img', { name: 'Villes' });

beforeEach(() => {
  clearWorldDataCache();
});

afterEach(() => {
  cleanup();
  clearWorldDataCache();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('WorldMap — rendu serveur', () => {
  it('se rend sans window, repères nommés, sans rien charger', () => {
    const { fetch } = network(ALL_FILES);
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    let html = '';
    try {
      html = renderToString(<WorldMap dataUrl="/world-map/v1" label="Villes" pins={PINS} />);
    } finally {
      vi.unstubAllGlobals();
    }

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Villes"');
    for (const pin of PINS) expect(html).toContain(`aria-label="${pin.label}"`);
    expect(html).toContain('Chargement de la carte');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('WorldMap — données', () => {
  it('dessine les pays du niveau chargé, avec la couleur de l’appelant', async () => {
    network(ALL_FILES);
    const { container } = render(
      <WorldMap
        dataUrl="/world-map/v1"
        fill={(id) => (id === 'FR' ? 'rgb(255, 0, 0)' : undefined)}
      />,
    );

    await waitFor(() => expect(container.querySelector('[data-country="FR"]')).not.toBeNull());
    const france = container.querySelector('[data-country="FR"]') as SVGPathElement;
    expect(france.style.fill).toBe('rgb(255, 0, 0)');
    expect(screen.queryByText(/Chargement de la carte/)).not.toBeInTheDocument();
  });

  it('garde le niveau affiché quand le suivant échoue, et le dit', async () => {
    reduceMotion();
    network(ALL_FILES, ['v1/50m.json']);
    const onDataError = vi.fn();
    const { container } = render(<Harness onDataError={onDataError} />);
    await waitFor(() => expect(container.querySelector('[data-country="FR"]')).not.toBeNull());

    /* Zoom 1 sur un cadre de 1000 px : zoom web 2,97, au-delà du seuil 50m. */
    fireEvent.keyDown(surface(), { key: '+' });

    await waitFor(() => expect(screen.getByText('Détails indisponibles')).toBeInTheDocument());
    expect(onDataError).toHaveBeenCalledOnce();
    expect(container.querySelector('[data-country="FR"]')).not.toBeNull();
  });

  it('abandonne la requête en cours quand dataUrl change', async () => {
    const { requests } = network({});
    const { rerender } = render(<WorldMap dataUrl="/a" />);
    await waitFor(() => expect(requests.map((r) => r.url).join()).toContain('/a/index.json'));

    rerender(<WorldMap dataUrl="/b" />);

    await waitFor(() => expect(requests.map((r) => r.url).join()).toContain('/b/index.json'));
    const first = requests.find((r) => r.url.endsWith('/a/index.json'));
    expect(first?.signal?.aborted).toBe(true);
  });
});

describe('WorldMap — clavier sur la carte', () => {
  it('zoome avec + et −, déplace aux flèches, revient avec 0 et Origine', () => {
    reduceMotion();
    network({});
    render(<Harness />);
    const svg = surface();
    expect(svg).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(svg, { key: '+' });
    expect(viewOf()[2]).toBe(1);
    fireEvent.keyDown(svg, { key: '-' });
    expect(viewOf()[2]).toBe(0);

    fireEvent.keyDown(svg, { key: '+' });
    const [longitude] = viewOf();
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(viewOf()[0]).toBeGreaterThan(longitude);

    fireEvent.keyDown(svg, { key: '0' });
    expect(viewOf()).toEqual([0, 20, 0]);

    fireEvent.keyDown(svg, { key: '+' });
    fireEvent.keyDown(svg, { key: 'Home' });
    expect(viewOf()).toEqual([0, 20, 0]);
  });

  it('laisse Ctrl / ⌘ + et − au navigateur', () => {
    reduceMotion();
    network({});
    render(<Harness />);

    const event = fireEvent.keyDown(surface(), { key: '+', ctrlKey: true });

    expect(event).toBe(true);
    expect(viewOf()[2]).toBe(0);
  });

  it('annonce la vue après une action au clavier', async () => {
    reduceMotion();
    network(ALL_FILES);
    const { container } = render(
      <Harness initialView={{ longitude: 2.35, latitude: 46, zoom: 0.5 }} />,
    );
    await waitFor(() => expect(container.querySelector('[data-country="FR"]')).not.toBeNull());

    fireEvent.keyDown(surface(), { key: '+' });

    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
        'Zoom 1,5, centré sur France',
      ),
    );
  });
});

describe('WorldMap — repères', () => {
  it('est une liste nommée, à un seul arrêt de tabulation', () => {
    network({});
    render(<Harness />);

    const list = screen.getByRole('list', { name: 'Repères' });
    expect(list).toBeInTheDocument();
    const buttons = PINS.map(({ label }) => screen.getByRole('button', { name: label }));
    expect(buttons.map((button) => button.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
      '-1',
    ]);
  });

  it('va de repère en repère par la géographie, Début et Fin par la liste', () => {
    reduceMotion();
    network({});
    render(<Harness />);
    const [paris, tokyo, rio, newYork] = PINS.map(({ label }) =>
      screen.getByRole('button', { name: label }),
    );

    act(() => paris.focus());
    fireEvent.keyDown(paris, { key: 'ArrowRight' });
    expect(tokyo).toHaveFocus();
    expect(tokyo).toHaveAttribute('tabindex', '0');
    expect(paris).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(tokyo, { key: 'ArrowLeft' });
    expect(paris).toHaveFocus();
    fireEvent.keyDown(paris, { key: 'ArrowLeft' });
    expect(newYork).toHaveFocus();
    fireEvent.keyDown(newYork, { key: 'Home' });
    expect(paris).toHaveFocus();
    fireEvent.keyDown(paris, { key: 'End' });
    expect(newYork).toHaveFocus();
    fireEvent.keyDown(newYork, { key: 'ArrowDown' });
    expect(rio).toHaveFocus();
  });

  it('appelle onPinSelect à l’Entrée et au clic, et annonce la sélection tenue par l’appelant', async () => {
    network({});
    const onPinSelect = vi.fn();
    const user = userEvent.setup();
    render(<Harness onPinSelect={onPinSelect} selectedPins={['tokyo']} />);
    const paris = screen.getByRole('button', { name: 'Paris' });

    act(() => paris.focus());
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Tokyo' }));

    expect(onPinSelect.mock.calls.map(([id]) => id)).toEqual(['paris', 'tokyo']);
    expect(screen.getByRole('button', { name: 'Tokyo' })).toHaveAttribute('aria-pressed', 'true');
    expect(paris).toHaveAttribute('aria-pressed', 'false');
  });

  it('ramène dans la vue un repère hors champ qui prend le focus, sans animation', () => {
    reduceMotion();
    network({});
    render(<Harness initialView={{ longitude: 2.35, latitude: 48.85, zoom: 4 }} />);
    const tokyo = screen.getByRole('button', { name: 'Tokyo' });

    act(() => tokyo.focus());

    const [longitude, latitude, zoom] = viewOf();
    expect(longitude).toBeCloseTo(139.69, 1);
    expect(latitude).toBeCloseTo(35.69, 1);
    expect(zoom).toBe(4);
  });

  it('ne déplace pas la vue pour un repère déjà visible', () => {
    reduceMotion();
    network({});
    render(<Harness initialView={{ longitude: 2.35, latitude: 48.85, zoom: 4 }} />);

    act(() => screen.getByRole('button', { name: 'Paris' }).focus());

    expect(viewOf()).toEqual([2.35, 48.85, 4]);
  });
});

describe('WorldMap — commandes', () => {
  it('rend indisponibles, sans les retirer, les commandes sans effet aux bornes', () => {
    reduceMotion();
    network({});
    const { unmount } = render(<Harness />);

    expect(screen.getByRole('button', { name: 'Dézoomer' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Vue d’ensemble' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Zoomer' })).not.toHaveAttribute('aria-disabled');
    unmount();

    render(<Harness initialView={{ longitude: 0, latitude: 0, zoom: 8 }} />);
    const zoomIn = screen.getByRole('button', { name: 'Zoomer' });
    expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(zoomIn);
    expect(viewOf()[2]).toBe(8);
    expect(screen.getByRole('button', { name: 'Dézoomer' })).not.toHaveAttribute('aria-disabled');
  });

  it('montre les flèches une fois zoomée, indisponibles au bord du monde', () => {
    reduceMotion();
    network({});
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Déplacer vers la gauche' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));
    /* Zoom 1, centré sur le méridien origine : il reste du monde de chaque côté. */
    expect(screen.getByRole('button', { name: 'Déplacer vers la gauche' })).not.toHaveAttribute(
      'aria-disabled',
    );
    for (let i = 0; i < 8; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Déplacer vers la gauche' }));
    }
    expect(screen.getByRole('button', { name: 'Déplacer vers la gauche' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

describe('WorldMap — infobulle', () => {
  it('nomme le pays survolé, et Échap la ferme', async () => {
    network(ALL_FILES);
    const { container } = render(<WorldMap dataUrl="/world-map/v1" label="Villes" />);
    await waitFor(() => expect(container.querySelector('[data-country="FR"]')).not.toBeNull());

    fireEvent.pointerMove(container.querySelector('[data-country="FR"]') as Element, {
      clientX: 10,
      clientY: 10,
    });
    expect(screen.getByText('France')).toBeInTheDocument();

    fireEvent.keyDown(surface(), { key: 'Escape' });
    expect(screen.queryByText('France')).not.toBeInTheDocument();
  });
});

describe('WorldMap — globe', () => {
  it('se rend sur le serveur en globe : le disque et les repères, sans rien charger', () => {
    const { fetch } = network(ALL_FILES);
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    let html = '';
    try {
      html = renderToString(
        <WorldMap dataUrl="/world-map/v1" label="Villes" pins={PINS} defaultMode="globe" />,
      );
    } finally {
      vi.unstubAllGlobals();
    }

    expect(html).toContain('data-mode="globe"');
    expect(html).toContain('opale-world-map__disc');
    for (const pin of PINS) expect(html).toContain(`aria-label="${pin.label}"`);
    expect(html).toContain('aria-pressed="true"');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('dessine graticule, pays et limbe une fois le globe chargé', async () => {
    network(ALL_FILES);
    const { container } = render(<Harness defaultMode="globe" />);

    await waitFor(() => expect(container.querySelector('[data-country="FR"]')).not.toBeNull());
    expect(container.querySelector('.opale-world-map__graticule')?.getAttribute('d')).toMatch(/^M/);
    const limb = container.querySelector('.opale-world-map__limb');
    expect(limb).toHaveAttribute('aria-hidden', 'true');
    expect(limb?.getAttribute('fill')).toMatch(/^url\(#/);
  });

  it('tourne au clavier, et borne le zoom à 3 en le disant', () => {
    reduceMotion();
    network({});
    render(<Harness defaultMode="globe" />);
    const svg = surface();

    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(viewOf()[0]).toBeGreaterThan(0);
    fireEvent.keyDown(svg, { key: 'ArrowUp' });
    expect(viewOf()[1]).toBeGreaterThan(20);
    /* La longitude fait le tour : huit pas à gauche passent l'antiméridien. */
    for (let i = 0; i < 8; i += 1) fireEvent.keyDown(svg, { key: 'ArrowLeft' });
    expect(viewOf()[0]).toBeGreaterThanOrEqual(-180);
    expect(viewOf()[0]).toBeLessThan(180);

    for (let i = 0; i < 5; i += 1) fireEvent.keyDown(svg, { key: '+' });
    expect(viewOf()[2]).toBe(3);
    const zoomIn = screen.getByRole('button', { name: 'Zoomer' });
    expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Passer en plan pour plus de détail')).toBeInTheDocument();
  });

  it('garde le centre en passant du plan au globe et retour', () => {
    reduceMotion();
    network({});
    render(<Harness initialView={{ longitude: 2.35, latitude: 48.85, zoom: 2 }} />);
    const globe = screen.getByRole('button', { name: 'Globe' });
    expect(globe).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(globe);

    expect(globe).toHaveAttribute('aria-pressed', 'true');
    expect(viewOf()).toEqual([2.35, 48.85, 2]);
    fireEvent.click(globe);
    expect(globe).toHaveAttribute('aria-pressed', 'false');
    expect(viewOf()).toEqual([2.35, 48.85, 2]);
  });

  it('ramène au focus un repère de la face cachée', () => {
    reduceMotion();
    network({});
    render(
      <Harness defaultMode="globe" initialView={{ longitude: 139.69, latitude: 35.69, zoom: 0 }} />,
    );
    const rio = screen.getByRole('button', { name: 'Rio de Janeiro' });
    expect(rio.closest('li')).toHaveAttribute('data-face', 'hidden');
    expect(screen.getByRole('button', { name: 'Tokyo' }).closest('li')).not.toHaveAttribute(
      'data-face',
    );

    act(() => rio.focus());

    const [longitude, latitude] = viewOf();
    expect(longitude).toBeCloseTo(-43.2, 1);
    expect(latitude).toBeCloseTo(-22.9, 1);
    expect(rio.closest('li')).not.toHaveAttribute('data-face');
  });
});

describe('WorldMap — bascules', () => {
  it('montre Globe et Satellite en aria-pressed, et les tait sans layerControls', () => {
    network({});
    const { unmount } = render(<Harness />);
    const satellite = screen.getByRole('button', { name: 'Satellite' });
    expect(satellite).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(satellite);
    expect(satellite).toHaveAttribute('aria-pressed', 'true');
    unmount();

    render(<Harness layerControls={false} />);
    expect(screen.queryByRole('button', { name: 'Globe' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Satellite' })).toBeNull();
  });

  it('en contrôlé, demande le changement sans le faire', () => {
    network({});
    const onModeChange = vi.fn();
    const onBasemapChange = vi.fn();
    render(
      <Harness
        mode="flat"
        onModeChange={onModeChange}
        basemap="vector"
        onBasemapChange={onBasemapChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Globe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Satellite' }));

    expect(onModeChange).toHaveBeenCalledWith('globe');
    expect(onBasemapChange).toHaveBeenCalledWith('satellite');
    expect(screen.getByRole('button', { name: 'Globe' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('WorldMap — imagerie', () => {
  /* Les tuiles de la vue, sans l'image du monde entier posée dessous. */
  const tiles = (container: HTMLElement) =>
    [...container.querySelectorAll('img.opale-world-map__tile')] as HTMLImageElement[];

  it('pose les tuiles sous le dessin, sans nom, et crédite la NASA tant qu’elles sont là', async () => {
    network(ALL_FILES);
    const { container } = render(<Harness defaultBasemap="satellite" />);

    await waitFor(() => expect(tiles(container).length).toBeGreaterThan(0));
    for (const img of tiles(container)) {
      expect(img).toHaveAttribute('alt', '');
      expect(img.src).toMatch(/^https:\/\/gibs\.earthdata\.nasa\.gov\/wmts\/.+\/2\/\d\/\d\.jpeg$/);
    }
    expect(screen.getByText(/NASA GIBS/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Satellite' }));
    expect(screen.queryByText(/NASA GIBS/)).toBeNull();
  });

  it('crédite la source de l’appelant quand tileUrl est surchargé', async () => {
    network(ALL_FILES);
    const { container } = render(
      <Harness
        defaultBasemap="satellite"
        tileUrl="https://tiles.test/{z}/{x}/{y}.png"
        tileAttribution="© Tuiles d’essai"
      />,
    );

    await waitFor(() => expect(tiles(container).length).toBeGreaterThan(0));
    expect(tiles(container)[0].src).toMatch(/^https:\/\/tiles\.test\/2\/\d\/\d\.png$/);
    expect(screen.getByText('© Tuiles d’essai')).toBeInTheDocument();
    expect(screen.queryByText(/NASA GIBS/)).toBeNull();
  });

  it('revient au dessin quand plus de la moitié des tuiles échouent, sans les redemander', async () => {
    network(ALL_FILES);
    const onBasemapError = vi.fn();
    const { container } = render(
      <Harness defaultBasemap="satellite" onBasemapError={onBasemapError} />,
    );
    await waitFor(() => expect(tiles(container).length).toBeGreaterThan(0));
    const requested = tiles(container).length;

    for (const img of tiles(container).slice(0, Math.floor(requested / 2) + 1)) {
      fireEvent.error(img);
    }

    await waitFor(() =>
      expect(screen.getByText('Imagerie indisponible : retour au dessin')).toBeInTheDocument(),
    );
    expect(onBasemapError).toHaveBeenCalledOnce();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.opale-world-map')).toHaveAttribute('data-basemap', 'vector');
    expect(screen.getByRole('button', { name: 'Satellite' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('revient au dessin quand la texture du globe est refusée (SecurityError)', async () => {
    network(ALL_FILES);
    class LoadingImage {
      crossOrigin: string | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', LoadingImage);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          drawImage: () => undefined,
          getImageData: () => {
            throw new DOMException('Toile souillée', 'SecurityError');
          },
        }) as unknown as CanvasRenderingContext2D,
    );
    const onBasemapError = vi.fn();
    render(
      <Harness defaultMode="globe" defaultBasemap="satellite" onBasemapError={onBasemapError} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Imagerie indisponible : retour au dessin')).toBeInTheDocument(),
    );
    expect(onBasemapError).toHaveBeenCalledOnce();
    expect((onBasemapError.mock.calls[0]?.[0] as Error).name).toBe('SecurityError');
  });
});

/* =============================================================================
   LES TRAITS SE VOIENT SUR LES TERRES.

   Côtes, frontières, limites régionales et fleuves portent la géographie : un
   objet graphique porteur de sens tient 3:1 contre ce qui l'entoure
   (WCAG 1.4.11), en clair comme en sombre.
   ========================================================================== */
describe('WorldMap — contraste des traits', () => {
  const themes = new Map<string, Theme>(parseThemes(opaleSource).map((t) => [t.name, t]));

  const mixOf = (property: string) => {
    const match = /^color-mix\(in srgb, var\((--[\w-]+)\) (\d+)%, var\((--[\w-]+)\)\)$/.exec(
      /* Prettier replie une valeur longue sur plusieurs lignes : elle est
         remise sur une seule avant lecture. */
      (declaration(opaleSource, '.opale-world-map', property) ?? '')
        .replace(/\s+/g, ' ')
        .replace(/\( /g, '(')
        .replace(/ \)/g, ')'),
    );
    expect(match, `${property} attendu en color-mix de deux jetons`).not.toBeNull();
    const [, top = '', share = '', bottom = ''] = match ?? [];
    return { top, share: Number(share) / 100, bottom };
  };

  for (const name of ['light', 'dark-explicit'] as const) {
    /* L'eau et les terres se distinguent d'un coup d'œil, en clair comme en
       sombre : le littoral n'est pas porté par le seul trait de côte. La
       teinte y aide — l'eau est bleue, les terres neutres —, la luminance
       seule garde 1,2:1 au moins (1,09:1 en sombre avant correction). */
    it(`sépare l’eau des terres en ${name}`, () => {
      const theme = themes.get(name) as Theme;
      const paint = ({ top, share, bottom }: ReturnType<typeof mixOf>) =>
        compositeOver(withAlpha(resolveToken(theme, top), share), resolveToken(theme, bottom));

      expect(
        contrastRatio(
          paint(mixOf('--opale-world-map-water')),
          paint(mixOf('--opale-world-map-land')),
        ),
      ).toBeGreaterThanOrEqual(1.2);
    });

    for (const line of ['coast', 'border', 'admin1', 'river'] as const) {
      it(`tient 3:1 entre ${line} et les terres en ${name}`, () => {
        const theme = themes.get(name) as Theme;
        const paint = ({ top, share, bottom }: ReturnType<typeof mixOf>) =>
          compositeOver(withAlpha(resolveToken(theme, top), share), resolveToken(theme, bottom));

        const land = paint(mixOf('--opale-world-map-land'));
        const stroke = paint(mixOf(`--opale-world-map-${line}`));

        expect(contrastRatio(stroke, land)).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

/* =============================================================================
   SUR L'IMAGERIE, LES TRAITS SONT CLAIRS ET CERNÉS DE SOMBRE.

   La photographie change d'un pixel à l'autre : aucun trait coloré n'y tient
   3:1 partout. Le trait clair et son halo sombre, des teintes fixes des deux
   thèmes, tiennent 3:1 entre eux — quelle que soit l'image dessous.
   ========================================================================== */
describe('WorldMap — traits sur l’imagerie', () => {
  const themes = new Map<string, Theme>(parseThemes(opaleSource).map((t) => [t.name, t]));
  const selector = ".opale-world-map[data-basemap='satellite']";
  const tokenOf = (property: string) => {
    const match = /^var\((--[\w-]+)\)$/.exec(declaration(opaleSource, selector, property) ?? '');
    expect(match, `${property} attendu en var() d’un jeton`).not.toBeNull();
    return match?.[1] ?? '';
  };

  for (const name of ['light', 'dark-explicit'] as const) {
    for (const line of ['coast', 'border', 'admin1', 'river'] as const) {
      it(`tient 3:1 entre ${line} et son halo en ${name}`, () => {
        const theme = themes.get(name) as Theme;
        expect(
          contrastRatio(
            resolveToken(theme, tokenOf(`--opale-world-map-${line}`)),
            resolveToken(theme, tokenOf('--opale-world-map-halo')),
          ),
        ).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
