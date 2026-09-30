import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { opaleThemeScript } from './theme-script';

/* =============================================================================
   LE SCRIPT ANTI-FLASH, EXÉCUTÉ TEL QU'IL SERA POSÉ DANS <head>.

   Le texte rendu est évalué ici comme le ferait le navigateur : c'est ce
   texte, et non la fonction qui le fabrique, que l'application sert.
   ========================================================================== */

const html = document.documentElement;
const originalMatchMedia = window.matchMedia;

function prefersDark(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? matches : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

function run(script: string) {
  // Le navigateur l'exécute en script classique ; `Function` en est l'équivalent le plus proche.
  new Function(script)();
}

beforeEach(() => {
  prefersDark(false);
  html.removeAttribute('data-mode');
});

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  vi.restoreAllMocks();
});

describe('opaleThemeScript', () => {
  it('devrait poser le thème mémorisé sur <html>', () => {
    localStorage.setItem('site-theme', 'dark');
    run(opaleThemeScript({ storageKey: 'site-theme' }));
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait laisser un clair mémorisé contredire un système sombre', () => {
    prefersDark(true);
    localStorage.setItem('site-theme', 'light');
    run(opaleThemeScript({ storageKey: 'site-theme' }));
    expect(html).toHaveAttribute('data-theme', 'light');
  });

  it('devrait résoudre « system » par la préférence du système', () => {
    prefersDark(true);
    localStorage.setItem('site-theme', 'system');
    run(opaleThemeScript({ storageKey: 'site-theme' }));
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait suivre le système par défaut, sans rien de mémorisé', () => {
    prefersDark(true);
    run(opaleThemeScript({ storageKey: 'site-theme' }));
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait appliquer `defaultTheme` quand rien n’est mémorisé', () => {
    prefersDark(true);
    run(opaleThemeScript({ storageKey: 'site-theme', defaultTheme: 'light' }));
    expect(html).toHaveAttribute('data-theme', 'light');
  });

  it('devrait ignorer une valeur mémorisée inconnue', () => {
    localStorage.setItem('site-theme', 'sepia');
    run(opaleThemeScript({ storageKey: 'site-theme', defaultTheme: 'dark' }));
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait fonctionner sans clé de stockage', () => {
    prefersDark(true);
    run(opaleThemeScript());
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait écrire l’attribut demandé', () => {
    localStorage.setItem('k', 'dark');
    run(opaleThemeScript({ storageKey: 'k', attribute: 'data-mode' }));
    expect(html).toHaveAttribute('data-mode', 'dark');
    expect(html).not.toHaveAttribute('data-theme');
  });

  it('ne devrait pas lever quand le stockage est refusé', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => run(opaleThemeScript({ storageKey: 'k' }))).not.toThrow();
  });

  it('ne devrait pas lever sans `matchMedia`', () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });
    run(opaleThemeScript());
    expect(html).toHaveAttribute('data-theme', 'light');
  });

  /* Le texte finit dans un `<script>` : une clé qui contiendrait `</script>`
     fermerait la balise et injecterait du HTML. */
  it('devrait échapper ce qui fermerait la balise <script>', () => {
    const script = opaleThemeScript({ storageKey: '</script><img src=x onerror=alert(1)>' });
    expect(script).not.toMatch(/<\/script/i);
    expect(script).not.toContain('<');
    localStorage.setItem('</script><img src=x onerror=alert(1)>', 'dark');
    run(script);
    expect(html).toHaveAttribute('data-theme', 'dark');
  });

  it('devrait rester un texte court, sans dépendance', () => {
    expect(opaleThemeScript({ storageKey: 'site-theme' }).length).toBeLessThan(500);
  });
});
