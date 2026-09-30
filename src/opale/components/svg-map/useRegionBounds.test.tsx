import { render, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SvgMap } from '../../catalog/svg-map';
import * as pathBoundsModule from './path-bounds';
import { useRegionBounds } from './useRegionBounds';

/* =============================================================================
   UNE CARTE NE RELIT PAS SES TRACÉS À CHAQUE RENDU.

   MESURÉ AVANT CE CORRECTIF : `SvgMap` calculait les boîtes dans un `useMemo`
   dépendant de `regions`. Un appelant qui écrit `regions={items.map(…)}` — le
   geste naturel — donne un nouveau tableau à chaque rendu, donc chaque survol,
   chaque sélection faisait relire deux cents chemins `d`. Le contenu, lui,
   n'avait pas changé. Les boîtes suivent désormais le CONTENU : mêmes
   identifiants, mêmes tracés, même carte.
   ========================================================================== */

vi.mock('./path-bounds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./path-bounds')>();
  return { ...actual, pathBounds: vi.fn(actual.pathBounds) };
});

const pathBounds = vi.mocked(pathBoundsModule.pathBounds);

const square = (x: number) => `M${x} 0h10v10h-10z`;
const regionsOf = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `r${index}`,
    name: `Région ${index}`,
    path: square(index * 10),
  }));

beforeEach(() => {
  pathBounds.mockClear();
});

describe('useRegionBounds', () => {
  it('devrait donner la boîte de chaque région lisible, et ignorer les autres', () => {
    const { result } = renderHook(() =>
      useRegionBounds([
        { id: 'a', path: square(0) },
        { id: 'b', path: 'n’importe quoi' },
      ]),
    );

    expect([...result.current.keys()]).toEqual(['a']);
    expect(result.current.get('a')).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
  });

  it('devrait rendre la même table pour un nouveau tableau au même contenu', () => {
    const { result, rerender } = renderHook(({ regions }) => useRegionBounds(regions), {
      initialProps: { regions: regionsOf(3) },
    });
    const first = result.current;
    pathBounds.mockClear();

    rerender({ regions: regionsOf(3) });

    expect(result.current).toBe(first);
    expect(pathBounds).not.toHaveBeenCalled();
  });

  it('ne devrait relire que le tracé qui a changé', () => {
    const { result, rerender } = renderHook(({ regions }) => useRegionBounds(regions), {
      initialProps: { regions: regionsOf(3) },
    });
    const first = result.current;
    pathBounds.mockClear();

    const next = regionsOf(3).map((region) =>
      region.id === 'r1' ? { ...region, path: square(100) } : region,
    );
    rerender({ regions: next });

    expect(result.current).not.toBe(first);
    expect(pathBounds).toHaveBeenCalledTimes(1);
    expect(result.current.get('r1')?.minX).toBe(100);
    expect(result.current.get('r0')).toBe(first.get('r0'));
  });

  it('devrait suivre un changement d’identifiant, même à tracé égal', () => {
    const { result, rerender } = renderHook(({ regions }) => useRegionBounds(regions), {
      initialProps: { regions: [{ id: 'a', path: square(0) }] },
    });

    rerender({ regions: [{ id: 'b', path: square(0) }] });

    expect([...result.current.keys()]).toEqual(['b']);
  });

  it('devrait suivre une région retirée', () => {
    const { result, rerender } = renderHook(({ regions }) => useRegionBounds(regions), {
      initialProps: { regions: regionsOf(3) },
    });

    rerender({ regions: regionsOf(2) });

    expect(result.current.size).toBe(2);
  });
});

describe('SvgMap et des régions non mémoïsées', () => {
  it('ne devrait pas relire deux cents tracés à chaque rendu du parent', () => {
    const view = render(<SvgMap viewBox="0 0 2000 10" label="Carte" regions={regionsOf(200)} />);
    expect(pathBounds).toHaveBeenCalledTimes(200);
    pathBounds.mockClear();

    for (let pass = 0; pass < 5; pass += 1) {
      view.rerender(<SvgMap viewBox="0 0 2000 10" label="Carte" regions={regionsOf(200)} />);
    }

    expect(pathBounds).not.toHaveBeenCalled();
  });
});
