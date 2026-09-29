import { createContext } from 'react';

/* LA PILE DES MODALES OUVERTES. Seule celle du dessus répond à Échap.

   Le dessus est la modale la plus profonde dans l'arbre React (une modale
   ouverte depuis une autre est au-dessus d'elle, même si les deux s'ouvrent
   dans le même rendu) ; à profondeur égale, la dernière ouverte. */

interface ModalStackEntry {
  readonly depth: number;
}

const stack: ModalStackEntry[] = [];

/** La profondeur de la modale englobante ; 0 hors de toute modale. */
export const ModalDepthContext = createContext(0);

/** Inscrit une modale ouverte ; la fonction rendue la retire. */
export function pushModal(depth: number): { entry: ModalStackEntry; release: () => void } {
  const entry: ModalStackEntry = { depth };
  stack.push(entry);
  return {
    entry,
    release: () => {
      const index = stack.indexOf(entry);
      if (index !== -1) stack.splice(index, 1);
    },
  };
}

/** Vrai quand `entry` est la modale du dessus. */
export function isTopModal(entry: ModalStackEntry): boolean {
  let top: ModalStackEntry | undefined;
  for (const candidate of stack) {
    if (!top || candidate.depth >= top.depth) top = candidate;
  }
  return top === entry;
}
