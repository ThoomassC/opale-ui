import { useEffect, useState } from 'react';

/**
 * La valeur, une fois que la frappe s'est arrêtée.
 *
 * Sert aux régions live : l'affichage suit chaque frappe, l'annonce attend la
 * dernière, sans quoi un lecteur d'écran lirait chaque compte intermédiaire.
 * Même délai que la galerie d'icônes.
 */
export function useSettledValue<T>(value: T, delayMs = 400): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
