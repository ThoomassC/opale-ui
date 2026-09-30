import { useSyncExternalStore } from 'react';

/* =============================================================================
   LE CONTENEUR DE PORTAIL, SANS ÉCART D'HYDRATATION (ROB-02, ROB-03).
   Interne : non réexporté.

   `document.body` était lu PENDANT le rendu, derrière un garde
   `typeof document === 'undefined'`. Le serveur rendait donc `null`, et le
   premier rendu client un portail : React constate l'écart, jette le HTML du
   serveur et recrée le sous-arbre. Posé à la racine, `ToastProvider` faisait
   ainsi recréer TOUTE l'application, sans un seul toast affiché.

   `useSyncExternalStore` sait exactement ce qu'il faut ici : l'instantané
   serveur (`null`) est aussi celui de l'hydratation, puis React rend à
   nouveau avec l'instantané client. Hors hydratation — un `createRoot`, une
   ouverture après coup —, l'instantané client sert dès le premier rendu : un
   portail ouvert au montage reste affiché sans attendre un effet. Le magasin
   ne change jamais, d'où l'abonnement vide. C'est le motif de `Toast`
   (`useToastAnchor`).
   ========================================================================== */

const subscribeNever = () => () => {};
const getBody = (): HTMLElement | null => document.body;
const getServerBody = (): HTMLElement | null => null;

/** `document.body` au client, `null` au serveur et pendant l'hydratation. */
export function useDocumentBody(): HTMLElement | null {
  return useSyncExternalStore(subscribeNever, getBody, getServerBody);
}
