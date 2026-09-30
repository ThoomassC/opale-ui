import { act, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useOpaleTheme } from './use-opale-theme';

/* =============================================================================
   LE CROCHET DE THÈME DU DOCUMENT : trois préférences, deux thèmes résolus.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const html = document.documentElement;
const originalMatchMedia = window.matchMedia;

/** Un `matchMedia` qu'on peut basculer, comme l'utilisateur bascule son OS. */
function fakeSystem(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<() => void>();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return query === '(prefers-color-scheme: dark)' && dark;
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    }),
  });
  return {
    setDark(next: boolean) {
      dark = next;
      for (const listener of [...listeners]) listener();
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

beforeEach(() => {
  fakeSystem(false);
});

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  html.removeAttribute('data-mode');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useOpaleTheme', () => {
  it('devrait suivre le système par défaut', () => {
    fakeSystem(true);
    const { result } = renderHook(() => useOpaleTheme());
    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait suivre un changement du système en direct', () => {
    const system = fakeSystem(false);
    const { result } = renderHook(() => useOpaleTheme());
    expect(result.current.resolvedTheme).toBe('light');

    act(() => system.setDark(true));
    expect(result.current.resolvedTheme).toBe('dark');
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait se désabonner du système au démontage', () => {
    const system = fakeSystem(false);
    const { unmount } = renderHook(() => useOpaleTheme());
    expect(system.listenerCount).toBeGreaterThan(0);
    unmount();
    expect(system.listenerCount).toBe(0);
  });

  it('devrait partir de `defaultTheme`', () => {
    fakeSystem(true);
    const { result } = renderHook(() => useOpaleTheme({ defaultTheme: 'light' }));
    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('devrait appliquer un choix explicite, sans stockage par défaut', () => {
    const { result } = renderHook(() => useOpaleTheme());
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(html).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.length).toBe(0);
  });

  it('devrait mémoriser le choix sous `storageKey` et le relire', () => {
    const first = renderHook(() => useOpaleTheme({ storageKey: 'site-theme' }));
    act(() => first.result.current.setTheme('dark'));
    expect(localStorage.getItem('site-theme')).toBe('dark');
    first.unmount();

    const second = renderHook(() => useOpaleTheme({ storageKey: 'site-theme' }));
    expect(second.result.current.theme).toBe('dark');
  });

  it('devrait mémoriser « system » comme un choix', () => {
    fakeSystem(true);
    localStorage.setItem('site-theme', 'light');
    const { result } = renderHook(() => useOpaleTheme({ storageKey: 'site-theme' }));
    act(() => result.current.setTheme('system'));
    expect(localStorage.getItem('site-theme')).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('devrait ignorer une valeur mémorisée inconnue', () => {
    localStorage.setItem('site-theme', 'sepia');
    const { result } = renderHook(() =>
      useOpaleTheme({ storageKey: 'site-theme', defaultTheme: 'dark' }),
    );
    expect(result.current.theme).toBe('dark');
  });

  it('devrait garder deux instances de la même clé d’accord', () => {
    const a = renderHook(() => useOpaleTheme({ storageKey: 'site-theme' }));
    const b = renderHook(() => useOpaleTheme({ storageKey: 'site-theme' }));
    act(() => a.result.current.setTheme('dark'));
    expect(b.result.current.theme).toBe('dark');
  });

  it('devrait suivre un choix fait dans un autre onglet', () => {
    const { result } = renderHook(() => useOpaleTheme({ storageKey: 'site-theme' }));
    act(() => {
      localStorage.setItem('site-theme', 'dark');
      window.dispatchEvent(new StorageEvent('storage', { key: 'site-theme', newValue: 'dark' }));
    });
    expect(result.current.theme).toBe('dark');
  });

  it('devrait garder le choix le temps de la session quand le stockage est refusé', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useOpaleTheme({ storageKey: 'site-theme' }));
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
  });

  it('devrait écrire l’attribut demandé sur la cible demandée', () => {
    const target = document.createElement('section');
    const { result } = renderHook(() => useOpaleTheme({ attribute: 'data-mode', target }));
    act(() => result.current.setTheme('dark'));
    expect(target).toHaveAttribute('data-mode', 'dark');
    expect(html).not.toHaveAttribute('data-mode');
    expect(html).not.toHaveAttribute('data-theme');
  });

  it('ne devrait rien écrire avec `target: null`', () => {
    const { result } = renderHook(() => useOpaleTheme({ target: null }));
    act(() => result.current.setTheme('dark'));
    expect(result.current.resolvedTheme).toBe('dark');
    expect(html).not.toHaveAttribute('data-theme');
  });

  it('devrait rendre l’attribut d’origine au démontage', () => {
    html.setAttribute('data-theme', 'dark');
    const { result, unmount } = renderHook(() => useOpaleTheme({ defaultTheme: 'light' }));
    expect(html).toHaveAttribute('data-theme', 'light');
    act(() => result.current.setTheme('light'));
    unmount();
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait garder une référence stable à `setTheme`', () => {
    const { result, rerender } = renderHook(() => useOpaleTheme({ storageKey: 'k' }));
    const first = result.current.setTheme;
    rerender();
    expect(result.current.setTheme).toBe(first);
  });
});

/* LE SERVEUR NE CONNAÎT NI LE STOCKAGE NI L'OS. Il rend le défaut ; le client
   reprend ce rendu tel quel, puis passe au thème réel juste après. */
describe('useOpaleTheme au rendu serveur', () => {
  function Probe() {
    const { theme, resolvedTheme } = useOpaleTheme({ storageKey: 'site-theme' });
    return (
      <p data-theme-choice={theme} data-theme-resolved={resolvedTheme}>
        {resolvedTheme}
      </p>
    );
  }

  function renderOnServer(node: ReactNode): string {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      return renderToString(node);
    } finally {
      vi.unstubAllGlobals();
    }
  }

  it('devrait rendre le défaut sans `window`', () => {
    expect(renderOnServer(<Probe />)).toContain('data-theme-choice="system"');
  });

  it('devrait s’hydrater sans écart puis appliquer le thème mémorisé', async () => {
    const markup = renderOnServer(<Probe />);
    localStorage.setItem('site-theme', 'dark');
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    const errors: string[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });
    const root = await act(async () =>
      hydrateRoot(
        host,
        <StrictMode>
          <Probe />
        </StrictMode>,
        { onRecoverableError: (error) => errors.push(String(error)) },
      ),
    );
    consoleError.mockRestore();

    expect(errors).toEqual([]);
    expect(host.querySelector('p')).toHaveAttribute('data-theme-resolved', 'dark');
    expect(html).toHaveAttribute('data-theme', 'dark');

    await act(async () => root.unmount());
    host.remove();
  });
});

/* L'HYDRATATION NE DOIT JAMAIS ÉCRIRE LE DÉFAUT DU SERVEUR SUR <html>. Le
   script anti-flash y a posé le vrai thème ; écrire `light` pendant la passe
   d'hydratation — où les magasins rendent l'instantané serveur — rejouerait
   le flash qu'il empêche. Sans `act`, qui viderait tout d'un coup et
   masquerait l'écriture intermédiaire. */
describe('useOpaleTheme à l’hydratation, sans act', () => {
  function Probe({ defaultTheme }: { readonly defaultTheme?: 'system' | 'light' | 'dark' }) {
    const { resolvedTheme } = useOpaleTheme({ storageKey: 'site-theme', defaultTheme });
    return <p>{resolvedTheme === 'dark' ? 'sombre' : 'clair'}</p>;
  }

  /** Chaque valeur écrite dans `data-theme` pendant l'hydratation, dans l'ordre. */
  async function writesDuringHydration(node: ReactNode, before: () => void): Promise<string[]> {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    let markup: string;
    try {
      markup = renderToString(node);
    } finally {
      vi.unstubAllGlobals();
    }
    before();
    // Ce que le script anti-flash aurait posé avant la peinture.
    html.setAttribute('data-theme', 'dark');
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    const records: MutationRecord[] = [];
    const observer = new MutationObserver((batch) => records.push(...batch));
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-theme'],
      attributeOldValue: true,
    });

    const flag = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    flag.IS_REACT_ACT_ENVIRONMENT = false;
    const root = hydrateRoot(host, node, { onRecoverableError: () => {} });
    let values: string[];
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      records.push(...observer.takeRecords());
      /* L'ancienne valeur de l'écriture suivante est la valeur de la
         précédente ; la dernière se lit sur l'élément. */
      values = [
        ...records.slice(1).map((record) => record.oldValue ?? ''),
        ...(records.length > 0 ? [html.getAttribute('data-theme') ?? ''] : []),
      ];
    } finally {
      observer.disconnect();
      root.unmount();
      host.remove();
      flag.IS_REACT_ACT_ENVIRONMENT = true;
    }
    return values;
  }

  it('ne devrait pas écrire le clair quand le stockage dit sombre', async () => {
    const values = await writesDuringHydration(<Probe />, () =>
      localStorage.setItem('site-theme', 'dark'),
    );
    expect(values).not.toContain('light');
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('ne devrait pas écrire le clair en mode système sous un OS sombre', async () => {
    const values = await writesDuringHydration(<Probe defaultTheme="system" />, () =>
      fakeSystem(true),
    );
    expect(values).not.toContain('light');
  });

  it('devrait bien écrire le clair quand c’est le vrai thème', async () => {
    const values = await writesDuringHydration(<Probe />, () =>
      localStorage.setItem('site-theme', 'light'),
    );
    expect(values).toEqual(['light']);
  });
});
