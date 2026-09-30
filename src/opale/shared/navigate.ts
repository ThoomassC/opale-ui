import type { MouseEvent } from 'react';

/* =============================================================================
   UN SEUL CONTRAT POUR BRANCHER LE ROUTEUR DE L'APPLICATION (DX-02).

   Les liens d'Opale restent de vrais `<a href>` : sans script, ils naviguent ;
   au clic du milieu ou avec Ctrl/Cmd, ils ouvrent un onglet. `onNavigate`
   n'est qu'un crochet posé par-dessus : sur un clic gauche SIMPLE, le
   composant annule la navigation native et remet la main à l'appelant, qui
   pousse l'adresse dans son routeur. Tout autre clic reste au navigateur.

   C'était la règle de `SiteNav` (`nav-bubble.tsx`) ; elle est tirée ici pour
   que Navbar, Menu, Breadcrumb, Sidebar.Item, LegalLinks et le pied de
   PageScaffold la suivent à l'identique.

   POURQUOI DES FONCTIONS ET PAS UN CROCHET REACT. Il n'y a ni état, ni effet,
   ni abonnement : un `useCallback` n'ajouterait qu'une mémoïsation que rien ne
   consomme. Deux fonctions pures se lisent mieux, s'appellent dans une boucle
   `map` et gardent ce module libre de toute valeur React.

   Brancher un routeur :

   ```tsx
   // Next.js (App Router)
   const router = useRouter();
   <Navbar items={items} onNavigate={(item, event) => {
     event.preventDefault();
     if (item.href) router.push(item.href);
   }} />

   // React Router
   const navigate = useNavigate();
   <Breadcrumb items={trail} onNavigate={(item) => item.href && navigate(item.href)} />
   ```

   `event.preventDefault()` est superflu là où le composant annule déjà, mais
   inoffensif : c'est la même recette partout, y compris pour PageScaffold,
   dont le contrat historique laisse l'annulation à l'appelant.
   ========================================================================== */

/** Le crochet de navigation côté client : l'entrée cliquée et l'événement du lien. */
export type NavigateHandler<Item> = (item: Item, event: MouseEvent<HTMLAnchorElement>) => void;

/**
 * Vrai quand le clic sur ce lien peut être confié au routeur de l'application :
 * bouton gauche, sans Ctrl, Cmd, Maj ni Alt, vers le même onglet (`target`
 * absent ou `_self`), sans `download`, et pas déjà annulé par un autre
 * gestionnaire. Faux sinon : le navigateur garde la main.
 */
export function shouldHandleNavigation(event: MouseEvent<HTMLAnchorElement>): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = event.currentTarget;
  const target = anchor.getAttribute('target');
  if (target && target !== '_self') return false;
  return !anchor.hasAttribute('download');
}

/**
 * Applique le contrat : si `onNavigate` est fourni et que le clic lui revient,
 * annule la navigation native puis l'appelle. Rend `true` quand le routeur a
 * pris la main — l'appelant peut alors mettre à jour son état local (entrée
 * courante, menu refermé).
 */
export function navigateOnClick<Item>(
  item: Item,
  event: MouseEvent<HTMLAnchorElement>,
  onNavigate: NavigateHandler<Item> | undefined,
): boolean {
  if (!onNavigate || !shouldHandleNavigation(event)) return false;
  event.preventDefault();
  onNavigate(item, event);
  return true;
}
