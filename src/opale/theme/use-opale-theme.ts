import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react';

import {
  DARK_SCHEME_QUERY,
  DEFAULT_THEME_ATTRIBUTE,
  isOpaleThemePreference,
  type OpaleResolvedTheme,
  type OpaleThemePreference,
} from './theme-script';

/* =============================================================================
   LE THÈME DU DOCUMENT, PUBLIÉ (THM-22).

   La vitrine avait son crochet et son script anti-flash ; la librairie n'en
   publiait aucun, et chaque application réécrivait les deux. Celui-ci gère
   TROIS préférences — clair, sombre, système — et les résout en deux thèmes.

   RIEN N'EST LU DANS UN EFFET. Le choix mémorisé et la préférence du système
   sont deux MAGASINS EXTERNES, lus par `useSyncExternalStore` : le serveur,
   qui n'a ni stockage ni OS, rend `defaultTheme` ; le client hydrate sur ce
   même rendu, puis passe aussitôt au thème réel. Aucun écart d'hydratation,
   et le script de `theme-script.ts` évite le flash visible entre les deux.

   L'EFFET NE FAIT QU'ÉCRIRE L'ATTRIBUT — la synchronisation avec le DOM, qui
   est bien un système extérieur. Il est posé à l'effet de mise en page, avant
   la peinture, et rend au démontage la valeur qu'il a trouvée.
   ========================================================================== */

/** Les réglages de `useOpaleTheme`. */
export interface UseOpaleThemeOptions {
  /**
   * La clé `localStorage` qui mémorise le choix. Sans clé, le choix vit le
   * temps de la page. La même clé doit être passée à `opaleThemeScript`.
   */
  readonly storageKey?: string;
  /** L'attribut écrit sur la cible. Défaut : `data-theme`, celui que lit `opale.css`. */
  readonly attribute?: string;
  /**
   * L'élément qui reçoit l'attribut. Défaut : `document.documentElement`.
   * `null` n'écrit rien : le crochet ne fait alors que calculer le thème.
   */
  readonly target?: Element | null;
  /** La préférence sans choix mémorisé. Défaut : `system`. */
  readonly defaultTheme?: OpaleThemePreference;
}

/** Ce que rend `useOpaleTheme`. */
export interface UseOpaleThemeResult {
  /** La préférence : `light`, `dark` ou `system`. */
  readonly theme: OpaleThemePreference;
  /** Le thème appliqué : `system` résolu par `prefers-color-scheme`. */
  readonly resolvedTheme: OpaleResolvedTheme;
  /** Change la préférence, et la mémorise sous `storageKey` s'il y en a une. */
  readonly setTheme: (theme: OpaleThemePreference) => void;
}

/* ---- La préférence du système. */

function subscribeSystem(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(DARK_SCHEME_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const readSystemDark = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia(DARK_SCHEME_QUERY).matches;

/** Le serveur n'a pas d'OS : il rend le clair, comme `opale.css` sans attribut. */
const readSystemDarkOnServer = (): boolean => false;

/* ---- Le choix mémorisé.

   `storage` ne part que vers les AUTRES onglets : les instances de la même
   page, qui partagent une clé, sont prévenues par cette liste. */
const storageListeners = new Set<() => void>();

function readStored(storageKey: string | undefined): OpaleThemePreference | null {
  if (storageKey === undefined) return null;
  try {
    const value = window.localStorage.getItem(storageKey);
    return isOpaleThemePreference(value) ? value : null;
  } catch {
    // Stockage refusé (navigation privée, cookies bloqués) : aucun choix mémorisé.
    return null;
  }
}

function writeStored(storageKey: string, theme: OpaleThemePreference): void {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Le choix vivra le temps de la page, et c'est acceptable.
  }
  for (const listener of [...storageListeners]) listener();
}

/**
 * La préférence, sa résolution et son écriture, sans toucher au DOM.
 * Interne : `PageScaffold` s'en sert pour son thème local, qui ne va pas sur `<html>`.
 */
export function useThemePreference(
  storageKey: string | undefined,
  defaultTheme: OpaleThemePreference,
): UseOpaleThemeResult {
  /* Le choix de la session : il tient quand le stockage est refusé, ou quand
     aucune clé n'est donnée. Le stockage, lui, l'emporte dès qu'il répond —
     c'est ce qui fait suivre un choix fait dans un autre onglet. */
  const [sessionTheme, setSessionTheme] = useState<OpaleThemePreference>(defaultTheme);

  const subscribeStored = useCallback(
    (onChange: () => void) => {
      if (storageKey === undefined) return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === storageKey) onChange();
      };
      storageListeners.add(onChange);
      window.addEventListener('storage', onStorage);
      return () => {
        storageListeners.delete(onChange);
        window.removeEventListener('storage', onStorage);
      };
    },
    [storageKey],
  );
  const stored = useSyncExternalStore(
    subscribeStored,
    () => readStored(storageKey),
    () => null,
  );
  const systemDark = useSyncExternalStore(subscribeSystem, readSystemDark, readSystemDarkOnServer);

  // Dérivés pendant le rendu, jamais dans un effet.
  const theme = stored ?? sessionTheme;
  const resolvedTheme: OpaleResolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  const setTheme = useCallback(
    (next: OpaleThemePreference) => {
      if (!isOpaleThemePreference(next)) return;
      setSessionTheme(next);
      if (storageKey !== undefined) writeStored(storageKey, next);
    },
    [storageKey],
  );

  return { theme, resolvedTheme, setTheme };
}

/**
 * Le thème du document : `light`, `dark` ou `system`, qui suit
 * `prefers-color-scheme` en direct.
 *
 * Il écrit le thème résolu sur `<html>` (`data-theme` par défaut, celui que lit
 * `opale.css`) et, avec `storageKey`, mémorise le choix dans `localStorage`.
 * Sûr au rendu serveur : le serveur rend `defaultTheme`, le client hydrate sur
 * ce même rendu puis applique le thème réel. Pour éviter le flash entre les
 * deux, posez `opaleThemeScript` avec les mêmes options dans `<head>`.
 *
 * ```tsx
 * 'use client';
 * const { theme, resolvedTheme, setTheme } = useOpaleTheme({ storageKey: 'site-theme' });
 * <button type="button" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *   Thème
 * </button>
 * ```
 *
 * Un seul appel par cible : deux instances qui écrivent le même attribut se
 * disputeraient la dernière écriture.
 */
export function useOpaleTheme(options: UseOpaleThemeOptions = {}): UseOpaleThemeResult {
  const {
    storageKey,
    attribute = DEFAULT_THEME_ATTRIBUTE,
    target,
    defaultTheme = 'system',
  } = options;
  const result = useThemePreference(storageKey, defaultTheme);
  const { resolvedTheme } = result;
  /* PAS D'ÉCRITURE PENDANT L'HYDRATATION. Les magasins y rendent l'instantané
     du SERVEUR — aucun choix mémorisé, pas d'OS sombre — donc un `light` qui
     n'est pas le thème réel. L'écrire sur `<html>` effacerait ce que
     `opaleThemeScript` y a posé, et rejouerait le flash qu'il empêche. Le vrai
     thème arrive au rendu qui suit l'hydratation ; l'attribut attend jusque-là.
     Un montage purement client est « hydraté » dès son premier rendu. */
  const hydrated = useHydrated();

  useLayoutEffect(() => {
    if (!hydrated) return undefined;
    const element = target === undefined ? document.documentElement : target;
    if (element === null) return undefined;
    const previous = element.getAttribute(attribute);
    element.setAttribute(attribute, resolvedTheme);
    return () => {
      if (previous === null) element.removeAttribute(attribute);
      else element.setAttribute(attribute, previous);
    };
  }, [attribute, hydrated, resolvedTheme, target]);

  return result;
}

/* ---- Rendu serveur ou client.

   `false` au serveur ET pendant l'hydratation, `true` ensuite : c'est le seul
   moyen de rendre au client, le temps de l'hydratation, exactement ce que le
   serveur a rendu. */
const subscribeNothing = () => () => {};

/** Vrai une fois l'hydratation passée. Interne. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}
