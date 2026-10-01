import { createContext } from 'react';

/** Les fonds qu'une `ScrollSection` peut peindre, chacun avec son encre. */
export type ScrollGround = 'paper' | 'amber' | 'night' | 'blue';

/**
 * L'inscription d'une section auprès de sa scène : la scène l'observe, et la
 * fonction rendue cesse de l'observer. Le fond est passé pour qu'un fond neuf
 * réinscrive la section — l'observateur la signale alors de nouveau. Absente
 * hors d'une scène : la section reste une bande statique.
 */
export const ScrollContext = createContext<
  ((node: HTMLElement, ground: ScrollGround) => () => void) | undefined
>(undefined);
