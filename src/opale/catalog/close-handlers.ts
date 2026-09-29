/* Les rappels de fermeture partagés par les surimpressions du catalogue. */

import type { MouseEventHandler } from 'react';

/* LA FERMETURE DES SURIMPRESSIONS. Le rappel canonique part d'abord, l'ancien
   ensuite et seulement pour une fermeture. Sans aucun des deux, il n'y a pas
   de rappel, donc ni croix ni bouton Fermer. */
export function closeHandler(
  onOpenChange: ((open: boolean) => void) | undefined,
  onClose: (() => void) | undefined,
): ((open: boolean) => void) | undefined {
  if (!onOpenChange && !onClose) return undefined;
  return (open) => {
    onOpenChange?.(open);
    if (!open) onClose?.();
  };
}

/* LE BOUTON QUI FERME. L'ancien rappel reçoit l'événement du clic, comme
   lorsqu'il était lui-même le gestionnaire du bouton ; le canonique reçoit
   `false`. */
export function closeClickHandler(
  onOpenChange: ((open: boolean) => void) | undefined,
  onClose: MouseEventHandler<HTMLButtonElement> | undefined,
): MouseEventHandler<HTMLButtonElement> | undefined {
  if (!onOpenChange && !onClose) return undefined;
  return (event) => {
    onOpenChange?.(false);
    onClose?.(event);
  };
}
