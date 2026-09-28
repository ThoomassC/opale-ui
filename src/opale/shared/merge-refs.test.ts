import { createElement, createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mergeRefs } from './merge-refs';

describe('mergeRefs', () => {
  it('devrait poser le nœud dans une ref objet et une ref fonction, puis les vider', () => {
    const object = createRef<HTMLDivElement>();
    const callback = vi.fn();
    const { container, unmount } = render(
      createElement('div', { ref: mergeRefs(object, callback) }),
    );
    const node = container.firstElementChild;

    expect(object.current).toBe(node);
    expect(callback).toHaveBeenCalledWith(node);

    unmount();

    expect(object.current).toBeNull();
    expect(callback).toHaveBeenLastCalledWith(null);
  });

  it('devrait appeler le nettoyage d’une ref fonction de React 19 au lieu de la rappeler avec null', () => {
    const cleanup = vi.fn();
    const callback = vi.fn(() => cleanup);
    const { unmount } = render(createElement('div', { ref: mergeRefs(callback) }));

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('devrait ignorer les refs absentes', () => {
    const object = createRef<HTMLSpanElement>();
    const merged = mergeRefs<HTMLSpanElement>(undefined, null, object);
    const node = document.createElement('span');

    const release = merged(node);

    expect(object.current).toBe(node);
    expect(typeof release).toBe('function');
    if (typeof release === 'function') release();
    expect(object.current).toBeNull();
  });
});
