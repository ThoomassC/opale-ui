import { beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { installInertFocus } from './inert';

/** jsdom ignores `inert`; browsers refuse to focus inside it. See `inert.ts`. */
installInertFocus();

/**
 * Node 25 ships a native `localStorage` that jsdom does not replace, and whose
 * handle survives between test files. The theme hook writes to it, so tests
 * would leak the last written theme into the next file. Stub it per run.
 */
const store = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  },
});

beforeEach(() => {
  store.clear();
  document.documentElement.removeAttribute('data-theme');
  /* Same leak, second axis: the material hook writes `data-material` on the
     same shared `<html>`, so a file that ends on glass would hand glass to the
     next one. This `beforeEach` exists to close exactly that. */
  document.documentElement.removeAttribute('data-material');
});

/** jsdom has no matchMedia; the theme hook asks it for the system preference. */
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
