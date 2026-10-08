import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearWorldDataCache } from './components/world-map/data-cache';
import { WorldMap } from './opale';

/* =============================================================================
   UN MORCEAU QUI NE SE CHARGE PAS.

   Le premier `import()` du globe échoue — un déploiement a renommé ses
   morceaux. La carte doit le dire tant que le globe manque, et réessayer
   quand on redemande le globe, sans recharger la page.
   ========================================================================== */

const attempts = vi.hoisted(() => ({ globe: 0 }));

vi.mock('./components/world-map/GlobeLayer', async (importOriginal) => {
  attempts.globe += 1;
  if (attempts.globe === 1) throw new Error('Morceau introuvable');
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

afterEach(() => {
  cleanup();
  clearWorldDataCache();
  vi.unstubAllGlobals();
});

describe('WorldMap — un globe qui ne se charge pas', () => {
  it('le dit tant qu’il manque, puis réessaie quand on redemande le globe', async () => {
    /* Le niveau 50m n'arrive qu'une fois l'échec du globe signalé : c'est
       son chargement qui effaçait le message. */
    let open: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      open = resolve;
    });
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('50m.json')) await gate;
      const name = Object.keys(FILES).find((suffix) => url.endsWith(suffix));
      return new Response(JSON.stringify(name ? FILES[name] : {}), { status: 200 });
    });
    vi.stubGlobal('fetch', fetch);
    const onDataError = vi.fn();
    const { container } = render(
      <WorldMap dataUrl="/world-map/v1" defaultMode="globe" onDataError={onDataError} />,
    );

    await waitFor(() => expect(onDataError).toHaveBeenCalledOnce());
    /* Les données arrivent ensuite : le message reste, le globe n'a pas de terres. */
    open();
    await waitFor(() => expect(screen.queryByText(/Chargement de la carte/)).toBeNull());
    expect(screen.getByText('Détails indisponibles')).toBeInTheDocument();
    expect(container.querySelector('[data-country]')).toBeNull();

    const globe = screen.getByRole('button', { name: 'Globe' });
    fireEvent.click(globe);
    fireEvent.click(globe);

    await waitFor(() => expect(container.querySelector('[data-country="FR"]')).not.toBeNull());
    expect(attempts.globe).toBe(2);
    expect(screen.queryByText('Détails indisponibles')).toBeNull();
  });
});
