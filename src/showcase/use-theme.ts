import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * La bascule de thème de la vitrine, non publiée : la librairie reste sans
 * hook. Elle gère deux thèmes et écrit `data-theme` ; le verre liquide reste
 * hors de cet état, chaque page de composant le pilote localement.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'tc-theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * Le choix explicite de l'utilisateur, ou `null` s'il n'en a jamais fait :
 * l'OS fait alors référence. Une valeur inconnue (dont « system ») se lit `null`.
 */
function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    // Stockage refusé (navigation privée, cookies bloqués) : on n'insiste pas.
    return null;
  }
}

function subscribeSystemTheme(onStoreChange: () => void): () => void {
  const query = window.matchMedia(DARK_SCHEME_QUERY);
  query.addEventListener('change', onStoreChange);
  return () => query.removeEventListener('change', onStoreChange);
}

function readSystemPrefersDark(): boolean {
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

/** Rendu serveur : pas de `matchMedia`, on part du clair. */
function readSystemPrefersDarkOnServer(): boolean {
  return false;
}

/**
 * La sérialisation de `transparent` — ce que rend `background-color` quand RIEN
 * ne peint l'élément. CSSOM normalise ainsi la valeur initiale dans tous les
 * moteurs, jsdom compris, où aucune feuille n'est appliquée : c'est donc la
 * réponse par défaut sous test, et elle veut dire « je ne sais pas ».
 */
const UNPAINTED = 'rgba(0, 0, 0, 0)';

/**
 * La couleur de la barre d'adresse mobile : le fond calculé de `body`, que
 * `tokens.css` puis `doc.css` peignent, et non un jeton recopié ici.
 *
 * L'appelant pose `data-theme` avant d'appeler. Une chaîne vide (page non
 * peinte, `var()` non substitué sous jsdom) veut dire : ne rien écrire.
 */
function readPaintedGround(): string {
  const painted = getComputedStyle(document.body).getPropertyValue('background-color').trim();

  // Rien ne peint : ni la couleur du sol ni celle du thème n'est connue.
  if (painted === '' || painted === 'transparent' || painted === UNPAINTED) return '';

  /* Une substitution `var()` qui n'a pas eu lieu. Un navigateur résout toujours
     `var()` dans une valeur calculée ; jsdom rend le littéral
     `var(--doc-ground)`, et l'écrire dans `theme-color` serait exactement
     annoncer une couleur fausse — celle-là ne serait même pas une couleur. */
  if (painted.includes('var(')) return '';

  return painted;
}

export interface ThemeControl {
  /** Le thème réellement appliqué : le choix mémorisé, sinon celui de l'OS. */
  readonly theme: Theme;
  readonly isDarkTheme: boolean;
  readonly toggleTheme: () => void;
}

/**
 * Bascule clair / sombre, à deux états. Le thème appliqué se dérive pendant le
 * rendu : choix mémorisé, sinon préférence système (`useSyncExternalStore`).
 *
 * `localStorage` n'est écrit que dans `toggleTheme`, jamais au montage : « n'a
 * jamais choisi » reste distinct de « a choisi ». `data-theme` et `theme-color`
 * ne sont posés que dans l'effet ; avant hydratation, le bloc
 * `@media (prefers-color-scheme: dark)` de `roles.css` porte le thème.
 */
export function useTheme(): ThemeControl {
  const [storedTheme, setStoredTheme] = useState<Theme | null>(readStoredTheme);

  const prefersDark = useSyncExternalStore(
    subscribeSystemTheme,
    readSystemPrefersDark,
    readSystemPrefersDarkOnServer,
  );

  // Dérivé pendant le rendu, jamais dans un effet.
  const theme: Theme = storedTheme ?? (prefersDark ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta === null) return;

    const ground = readPaintedGround();
    if (ground === '') return;

    meta.setAttribute('content', ground);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Le thème vivra le temps de la session, et c'est acceptable.
    }

    setStoredTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  return {
    theme,
    isDarkTheme: theme === 'dark',
    toggleTheme,
  };
}
