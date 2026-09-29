import { createContext } from 'react';

/**
 * Le niveau des titres de spécimen et de tableau de props.
 *
 * `2` sous le `<h1>` de la coquille ; une section du gabarit de composant le
 * passe à `3`, pour que ses spécimens se rangent sous son propre `<h2>`.
 */
export const DocHeadingLevel = createContext<2 | 3>(2);
