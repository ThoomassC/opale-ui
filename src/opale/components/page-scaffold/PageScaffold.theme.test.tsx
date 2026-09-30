import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageScaffold } from './PageScaffold';

/* =============================================================================
   LE THÈME DE PAGESCAFFOLD : SYSTÈME ET MÉMOIRE, EN OPTION (THM-22).

   Le défaut ne bouge pas — clair, sans stockage. `defaultTheme="system"` suit
   l'OS en direct ; `themeStorageKey` mémorise le choix de la bascule.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const originalMatchMedia = window.matchMedia;
const THEME_BUTTON = { name: 'Changer le thème clair ou sombre' };

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
  };
}

const rootOf = (container: HTMLElement) => container.firstElementChild;

beforeEach(() => {
  fakeSystem(false);
});

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('PageScaffold — thème système et mémorisé', () => {
  it('devrait rester clair par défaut, même sous un système sombre', () => {
    fakeSystem(true);
    const { container } = render(<PageScaffold />);
    expect(rootOf(container)).toHaveAttribute('data-opale-page-theme', 'light');
  });

  it('devrait suivre le système avec `defaultTheme="system"`, en direct', () => {
    const system = fakeSystem(true);
    const { container } = render(<PageScaffold defaultTheme="system" />);
    expect(rootOf(container)).toHaveAttribute('data-opale-page-theme', 'dark');
    expect(screen.getByRole('button', THEME_BUTTON)).toHaveAttribute('aria-pressed', 'true');

    act(() => system.setDark(false));
    expect(rootOf(container)).toHaveAttribute('data-opale-page-theme', 'light');
  });

  it('devrait basculer le thème résolu et prévenir `onThemeChange`', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    fakeSystem(true);
    const { container } = render(
      <PageScaffold defaultTheme="system" onThemeChange={onThemeChange} />,
    );

    await user.click(screen.getByRole('button', THEME_BUTTON));
    expect(onThemeChange).toHaveBeenCalledWith('light');
    expect(rootOf(container)).toHaveAttribute('data-opale-page-theme', 'light');
  });

  it('ne devrait pas prévenir `onThemeChange` quand seul le système change', () => {
    const system = fakeSystem(false);
    const onThemeChange = vi.fn();
    render(<PageScaffold defaultTheme="system" onThemeChange={onThemeChange} />);
    act(() => system.setDark(true));
    expect(onThemeChange).not.toHaveBeenCalled();
  });

  it('devrait mémoriser le choix sous `themeStorageKey` et le relire', async () => {
    const user = userEvent.setup();
    const first = render(<PageScaffold themeStorageKey="site-theme" />);
    await user.click(screen.getByRole('button', THEME_BUTTON));
    expect(localStorage.getItem('site-theme')).toBe('dark');
    first.unmount();

    const { container } = render(<PageScaffold themeStorageKey="site-theme" />);
    expect(rootOf(container)).toHaveAttribute('data-opale-page-theme', 'dark');
  });

  it('ne devrait rien écrire sans `themeStorageKey`', async () => {
    const user = userEvent.setup();
    render(<PageScaffold />);
    await user.click(screen.getByRole('button', THEME_BUTTON));
    expect(localStorage.length).toBe(0);
  });

  it('devrait laisser le thème contrôlé l’emporter sur le choix mémorisé', () => {
    localStorage.setItem('site-theme', 'dark');
    const { container } = render(<PageScaffold theme="light" themeStorageKey="site-theme" />);
    expect(rootOf(container)).toHaveAttribute('data-opale-page-theme', 'light');
  });

  it('ne devrait pas toucher au thème de <html>', async () => {
    const user = userEvent.setup();
    render(<PageScaffold defaultTheme="system" themeStorageKey="site-theme" />);
    await user.click(screen.getByRole('button', THEME_BUTTON));
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });
});

/* LE SERVEUR NE SAIT PAS. Avec une préférence qu'il ne peut pas lire —
   système ou mémoire —, il rend la racine SANS thème local : elle hérite de
   `<html>`, que `opaleThemeScript` a déjà posé. Le client hydrate sur ce rendu,
   puis pose le thème réel. */
describe('PageScaffold — thème au rendu serveur', () => {
  function renderOnServer(element: React.ReactElement): string {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      return renderToString(element);
    } finally {
      vi.unstubAllGlobals();
    }
  }

  async function hydrate(element: () => React.ReactElement, before?: () => void) {
    const markup = renderOnServer(element());
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);
    const serverRoot = host.firstElementChild;
    before?.();
    const errors: string[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });
    const root = await act(async () =>
      hydrateRoot(host, <StrictMode>{element()}</StrictMode>, {
        onRecoverableError: (error) => errors.push(String(error)),
      }),
    );
    consoleError.mockRestore();
    return { host, root, errors, serverRoot, markup };
  }

  it('devrait garder le clair rendu par le serveur par défaut', async () => {
    const { host, root, errors, markup } = await hydrate(() => <PageScaffold siteName="t" />);
    expect(markup).toContain('data-opale-page-theme="light"');
    expect(errors).toEqual([]);
    expect(host.firstElementChild).toHaveAttribute('data-opale-page-theme', 'light');
    await act(async () => root.unmount());
    host.remove();
  });

  it('devrait hériter de <html> au serveur puis appliquer le choix mémorisé', async () => {
    const { host, root, errors, markup, serverRoot } = await hydrate(
      () => <PageScaffold siteName="t" themeStorageKey="site-theme" />,
      () => localStorage.setItem('site-theme', 'dark'),
    );
    expect(markup).not.toContain('data-opale-page-theme');
    expect(errors).toEqual([]);
    expect(host.firstElementChild).toBe(serverRoot);
    expect(host.firstElementChild).toHaveAttribute('data-opale-page-theme', 'dark');
    await act(async () => root.unmount());
    host.remove();
  });

  it('devrait s’hydrater sans écart en mode système sous un OS sombre', async () => {
    const { host, root, errors, markup } = await hydrate(
      () => <PageScaffold siteName="t" defaultTheme="system" />,
      () => fakeSystem(true),
    );
    expect(markup).not.toContain('data-opale-page-theme');
    expect(errors).toEqual([]);
    expect(host.firstElementChild).toHaveAttribute('data-opale-page-theme', 'dark');
    await act(async () => root.unmount());
    host.remove();
  });
});
