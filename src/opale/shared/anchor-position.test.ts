import { describe, expect, it } from 'vitest';

import { computeAnchorPosition, type AnchorPositionInput } from './anchor-position';

const base: AnchorPositionInput = {
  anchor: { top: 300, left: 400, width: 100, height: 40 },
  floating: { width: 200, height: 80 },
  viewport: { width: 1000, height: 800 },
  side: 'top',
  align: 'center',
  offset: 8,
  margin: 8,
};

describe('computeAnchorPosition', () => {
  it('pose la surface au-dessus, centrée, quand la place suffit', () => {
    expect(computeAnchorPosition(base)).toEqual({ top: 212, left: 350, side: 'top' });
  });

  it('pose chaque côté à `offset` de l’ancre', () => {
    expect(computeAnchorPosition({ ...base, side: 'bottom' })).toMatchObject({ top: 348 });
    expect(computeAnchorPosition({ ...base, side: 'left' })).toMatchObject({ left: 192 });
    expect(computeAnchorPosition({ ...base, side: 'right' })).toMatchObject({ left: 508 });
  });

  it('bascule du côté opposé quand le côté demandé n’a pas la place', () => {
    const nearTop = { ...base, anchor: { ...base.anchor, top: 20 } };
    expect(computeAnchorPosition(nearTop)).toMatchObject({ side: 'bottom', top: 68 });

    const nearRight = { ...base, side: 'right' as const, anchor: { ...base.anchor, left: 850 } };
    expect(computeAnchorPosition(nearRight)).toMatchObject({ side: 'left' });
  });

  it('garde le côté qui offre le plus de place quand aucun ne suffit', () => {
    const tall = {
      ...base,
      anchor: { ...base.anchor, top: 500 },
      floating: { width: 200, height: 600 },
    };
    expect(computeAnchorPosition(tall).side).toBe('top');
    const low = { ...tall, anchor: { ...base.anchor, top: 200 } };
    expect(computeAnchorPosition(low).side).toBe('bottom');
  });

  it('aligne sur le bord de début ou de fin', () => {
    expect(computeAnchorPosition({ ...base, align: 'start' }).left).toBe(400);
    expect(computeAnchorPosition({ ...base, align: 'end' }).left).toBe(300);
  });

  it('ramène la surface dans la fenêtre sur l’axe transverse', () => {
    const nearLeft = { ...base, anchor: { ...base.anchor, left: 0 } };
    expect(computeAnchorPosition(nearLeft).left).toBe(8);
    const nearRight = { ...base, anchor: { ...base.anchor, left: 950 } };
    expect(computeAnchorPosition(nearRight).left).toBe(792);
    const wide = { ...base, floating: { width: 2000, height: 80 } };
    expect(computeAnchorPosition(wide).left).toBe(8);
  });
});
