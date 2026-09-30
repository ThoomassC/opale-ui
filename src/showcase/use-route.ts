import { useSyncExternalStore } from 'react';

import { HOME_SLUG, parseSlug } from './doc-model';

/* Le routage de la vitrine : `location.hash` lu comme un magasin extérieur par
   `useSyncExternalStore`. L'abonnement est symétrique en mode strict, React
   relit l'instantané après s'être abonné, et l'instantané est une chaîne,
   donc stable d'une lecture à l'autre. */

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('hashchange', onStoreChange);
  return () => window.removeEventListener('hashchange', onStoreChange);
}

function getSnapshot(): string {
  return parseSlug(window.location.hash);
}

/**
 * Rendu serveur : il n'y a ni `window` ni fragment, donc l'accueil.
 *
 * La vitrine n'est pas prérendue aujourd'hui — `main.tsx` fait `createRoot` —
 * mais un instantané serveur est exigé par la signature, et l'accueil est la
 * seule réponse honnête : le fragment n'est jamais envoyé au serveur.
 */
function getServerSnapshot(): string {
  return HOME_SLUG;
}

/**
 * Le slug de la page courante, tel que le fragment le dit.
 *
 * Le hook ne connaît PAS le registre des pages : il rend ce qu'il lit, y
 * compris un slug inconnu. C'est la coquille qui décide du repli, parce que
 * c'est elle qui possède la liste des pages.
 */
export function useRoute(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
