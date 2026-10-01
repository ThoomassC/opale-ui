/* =============================================================================
   LA LIGNE DE FLOTTAISON, EN CALCUL PUR.

   jsdom n'a pas de mise en page : la décision « cet élément est-il sous la
   vue ? » se prend ici, rectangle en main, et se teste sans navigateur.
   ========================================================================== */

/**
 * Vrai quand le haut de l'élément est au bas de la vue ou plus bas : rien de
 * lui n'est encore visible. Un élément déjà à l'écran, même en partie, ou
 * au-dessus, n'est jamais dit caché. Sans hauteur de vue connue, rien ne l'est.
 */
export function isBelowFold(rect: Pick<DOMRectReadOnly, 'top'>, viewportHeight: number): boolean {
  return viewportHeight > 0 && rect.top >= viewportHeight;
}
