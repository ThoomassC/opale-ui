import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearWorldDataCache } from './components/world-map/data-cache';
import { WorldMap } from './opale';

/* =============================================================================
   LE GLOBE ET L'IMAGERIE NE SE CHARGENT QU'AU PREMIER USAGE.

   Chaque module paresseux est simulé par une fabrique qui note son passage :
   Vitest ne l'appelle qu'au premier `import()` du module. Une carte en plan
   vectoriel ne doit en appeler aucune.
   ========================================================================== */

const loaded = vi.hoisted(() => new Set<string>());

vi.mock('./components/world-map/GlobeLayer', async (importOriginal) => {
  loaded.add('GlobeLayer');
  return importOriginal();
});
vi.mock('./components/world-map/FlatRaster', async (importOriginal) => {
  loaded.add('FlatRaster');
  return importOriginal();
});
vi.mock('./components/world-map/GlobeRaster', async (importOriginal) => {
  loaded.add('GlobeRaster');
  return importOriginal();
});

const LEVEL = {
  v: 1,
  q: [0, 0, 1],
  bbox: [-180, -90, 180, 90],
  countries: [{ id: 'FR', r: [[[-5, 40, 15, 0, 0, 12, -15, 0]]] }],
  coast: [],
  borders: [],
};
const FILES: Record<string, unknown> = {
  'index.json': {
    version: 1,
    source: { name: 'Natural Earth', version: '5.1.2' },
    lods: {
      '110m': { file: '110m.json' },
      '50m': { file: '50m.json' },
      '10m': { tileDegrees: 10, tiles: [] },
    },
  },
  '110m.json': LEVEL,
  '50m.json': LEVEL,
};

function serve() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const name = Object.keys(FILES).find((suffix) => String(input).endsWith(suffix));
      return Promise.resolve(
        new Response(JSON.stringify(name ? FILES[name] : {}), { status: 200 }),
      );
    }),
  );
}

afterEach(() => {
  cleanup();
  clearWorldDataCache();
  vi.unstubAllGlobals();
});

/* L'ordre compte : un module chargé le reste pour tout le fichier. */
describe('WorldMap — chargement à la demande', () => {
  it('ne charge ni le globe ni l’imagerie en plan vectoriel', async () => {
    serve();
    const { container } = render(<WorldMap dataUrl="/world-map/v1" />);

    await waitFor(() => expect(container.querySelector('[data-country="FR"]')).not.toBeNull());
    /* Un tour de plus : un `import()` lancé dans un effet aurait eu le temps de partir. */
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect([...loaded]).toEqual([]);
  });

  it('charge l’imagerie du plan au passage en satellite, et elle seule', async () => {
    serve();
    render(<WorldMap dataUrl="/world-map/v1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Satellite' }));

    await waitFor(() => expect(loaded.has('FlatRaster')).toBe(true));
    expect(loaded.has('GlobeLayer')).toBe(false);
    expect(loaded.has('GlobeRaster')).toBe(false);
  });

  it('charge le globe au passage en globe', async () => {
    serve();
    render(<WorldMap dataUrl="/world-map/v1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Globe' }));

    await waitFor(() => expect(loaded.has('GlobeLayer')).toBe(true));
    expect(loaded.has('GlobeRaster')).toBe(false);
  });
});
