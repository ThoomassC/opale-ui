/* Le choix de consentement mémorisé : lecture gardée du stockage, et
   abonnement pour `useSyncExternalStore`. Le stockage peut manquer
   (navigation privée, cookies bloqués) : chaque accès est gardé. */

export const COOKIE_CONSENT_KEY = 'opale-cookie-consent';

export type CookieConsent = 'accepted' | 'declined';

/** Le choix mémorisé sous `key`, ou `null` s'il n'y en a pas ou que le stockage manque. */
export function readCookieConsent(key: string | null = COOKIE_CONSENT_KEY): CookieConsent | null {
  if (!key || typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(key);
    return stored === 'accepted' || stored === 'declined' ? stored : null;
  } catch {
    return null;
  }
}

const consentListeners = new Set<() => void>();

/** Abonne `listener` aux choix faits ici et dans les autres onglets (`storage`). */
export function subscribeConsent(listener: () => void) {
  consentListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    consentListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** Prévient les bandeaux montés qu'un choix vient d'être fait dans cet onglet. */
export function notifyConsent() {
  consentListeners.forEach((listener) => listener());
}
