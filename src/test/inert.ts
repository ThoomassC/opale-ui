/* =============================================================================
   `inert` POUR JSDOM, RÉDUIT À CE QU'UN TEST PEUT OBSERVER : LE FOCUS.

   jsdom n'implémente pas `inert` (vérifié sur jsdom 29 : `focus()` sur un
   bouton sous `<div inert>` le rend actif). Un test de rendu qui compte sur
   l'inertie passe donc à vide — c'est ainsi que le modal a livré une
   restitution de focus cassée pendant que son test était vert.

   On pose la sémantique du navigateur, et seulement elle : `focus()` sur un
   élément qui est, ou descend d'un élément, `inert` ne fait rien et ne lève
   rien. Ce n'est pas un mock du projet : c'est la frontière, le DOM, qu'on
   complète là où jsdom s'arrête.

   CE QUI N'EST PAS REPRODUIT, ET POURQUOI : le retrait des clics et de l'arbre
   d'accessibilité. Aucun test n'en dépend aujourd'hui, et une imitation
   partielle de ces deux-là mentirait plus qu'elle ne prouverait.
   ========================================================================== */

export function installInertFocus(): void {
  const proto = window.HTMLElement.prototype;
  const nativeFocus = proto.focus;

  proto.focus = function focus(this: HTMLElement, options?: FocusOptions) {
    if (this.closest('[inert]')) return;
    nativeFocus.call(this, options);
  };
}
