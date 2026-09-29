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

/* Le choix lu, par clé, tant qu'un bandeau est abonné : `useSyncExternalStore`
   relit l'instantané à chaque rendu, et le stockage est synchrone. Le cache
   tombe à chaque choix fait ici, à chaque événement `storage` et quand le
   dernier bandeau se désabonne. */
const cachedConsent = new Map<string, CookieConsent | null>();

/** `readCookieConsent`, servi depuis le cache tant qu'un bandeau est abonné. */
export function readCachedCookieConsent(key: string | null): CookieConsent | null {
  if (!key) return null;
  const cached = cachedConsent.get(key);
  if (cached !== undefined) return cached;
  const consent = readCookieConsent(key);
  if (consentListeners.size > 0) cachedConsent.set(key, consent);
  return consent;
}

/** Abonne `listener` aux choix faits ici et dans les autres onglets (`storage`). */
export function subscribeConsent(listener: () => void) {
  const onStorage = () => {
    cachedConsent.clear();
    listener();
  };
  consentListeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    consentListeners.delete(listener);
    window.removeEventListener('storage', onStorage);
    if (consentListeners.size === 0) cachedConsent.clear();
  };
}

/** Prévient les bandeaux montés qu'un choix vient d'être fait dans cet onglet. */
export function notifyConsent() {
  cachedConsent.clear();
  consentListeners.forEach((listener) => listener());
}
