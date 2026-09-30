import { useCallback, useEffect, useRef } from 'react';

/* =============================================================================
   FERMER SUR UN APPUI AU DEHORS, SANS CONFONDRE « DEHORS » ET « AILLEURS DANS
   LE DOM ». Interne : non réexporté.

   Une surface ancrée est rendue dans un portail : son DOM n'est pas celui de
   son déclencheur, et un popover ouvert DEPUIS un autre n'est pas dans le DOM
   du premier. Un test `contains` fermait donc le parent au premier clic dans
   l'enfant. Ce qui dit « dedans », c'est l'arbre REACT, que les événements
   synthétiques remontent à travers les portails.

   LE MÉCANISME. Les parties qui comptent comme « dedans » appellent
   `markInside` sur leur `onPointerDown` React. React écoute sur sa racine,
   qui est DANS le document : son gestionnaire passe avant l'écoute de
   `document` en phase de bouillonnement, qui lit le drapeau et le relâche.
   Sans drapeau, l'appui venait du dehors.
   ========================================================================== */

/** Appelle `onOutsidePress` à chaque appui hors des parties marquées, tant que `active`. */
export function useOutsidePress(
  active: boolean,
  onOutsidePress: () => void,
): { readonly markInside: () => void } {
  const inside = useRef(false);

  useEffect(() => {
    if (!active) return undefined;
    /* Un appui sur le déclencheur FERMÉ a posé le drapeau sans écoute pour le
       relâcher : sans cette remise à zéro, le premier appui au dehors après
       l'ouverture serait ignoré. */
    inside.current = false;
    const handlePointerDown = () => {
      if (inside.current) {
        inside.current = false;
        return;
      }
      onOutsidePress();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [active, onOutsidePress]);

  const markInside = useCallback(() => {
    inside.current = true;
  }, []);

  return { markInside };
}
