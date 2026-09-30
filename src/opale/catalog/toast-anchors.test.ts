import { afterEach, describe, expect, it, vi } from 'vitest';

import { getToastAnchor, subscribeToastAnchor } from './toast-anchors';

/* Un message qui se monte ne doit pas réveiller ceux déjà montés : leur ancre
   n'a pas changé. Seuls les abonnés d'une place dont l'ancre naît ou
   disparaît sont prévenus. */

const releases: Array<() => void> = [];
const occupy = (...args: Parameters<typeof subscribeToastAnchor>) => {
  releases.push(subscribeToastAnchor(...args));
};

afterEach(async () => {
  releases.splice(0).forEach((release) => release());
  await Promise.resolve();
});

describe('les ancres de Toast', () => {
  it('ne devrait pas prévenir un abonné quand un message occupe la même ancre', () => {
    const first = vi.fn();
    occupy('bottom-right', first);
    first.mockClear();

    occupy('bottom-right', vi.fn());

    expect(first).not.toHaveBeenCalled();
  });

  it('ne devrait pas prévenir un abonné quand une autre place crée son ancre', () => {
    const first = vi.fn();
    occupy('bottom-right', first);
    first.mockClear();

    occupy('top-left', vi.fn());

    expect(getToastAnchor('top-left')).not.toBeNull();
    expect(first).not.toHaveBeenCalled();
  });

  it('ne devrait pas prévenir un abonné quand une autre place retire son ancre', async () => {
    const first = vi.fn();
    occupy('bottom-right', first);
    const releaseOther = subscribeToastAnchor('top-left', vi.fn());
    first.mockClear();

    releaseOther();
    await Promise.resolve();

    expect(getToastAnchor('top-left')).toBeNull();
    expect(first).not.toHaveBeenCalled();
  });

  it('devrait garder l’ancre tant qu’un message l’occupe, et la retirer après le dernier', async () => {
    const releaseFirst = subscribeToastAnchor('bottom-left', vi.fn());
    const releaseSecond = subscribeToastAnchor('bottom-left', vi.fn());
    const anchor = getToastAnchor('bottom-left');

    releaseFirst();
    await Promise.resolve();
    expect(getToastAnchor('bottom-left')).toBe(anchor);
    expect(anchor?.root.isConnected).toBe(true);

    releaseSecond();
    await Promise.resolve();
    expect(getToastAnchor('bottom-left')).toBeNull();
    expect(anchor?.root.isConnected).toBe(false);
  });
});
