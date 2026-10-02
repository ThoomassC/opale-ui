import { createContext } from 'react';

/* =============================================================================
   LE THÈME LOCAL DU GABARIT, TRANSMIS PAR REACT ET NON PAR LE DOM (THM-05).
   Interne : non réexporté.

   `PageScaffold` pose son thème sur sa racine, `data-opale-page-theme`, et les
   jetons en descendent. Une modale ou un message se rend dans un portail,
   donc dans `<body>`, HORS de cette racine : un dialogue blanc s'ouvrait
   au-dessus d'un gabarit sombre.

   UN CONTEXTE, PARCE QU'IL TRAVERSE LES PORTAILS. La 2.9.2 a d'abord repéré
   le thème par une ancre cachée rendue sur place : un `<span>` en plein
   `<tbody>` cassait l'imbrication du DOM — et, rendu par le serveur, le
   parseur le sortait du tableau, d'où une hydratation ratée —, sans compter
   les `:empty` et `:last-child` des parents. Le contexte ne rend rien, et il
   se lit PENDANT le rendu : le conteneur du portail porte le bon thème dès sa
   première image. Une modale ouverte depuis une autre le reçoit aussi, les
   portails transmettant le contexte React.

   `null` hors de tout gabarit : la surimpression ne pose alors rien, et suit
   le thème global comme en 2.9.1.
   ========================================================================== */

/** Le thème effectif du gabarit englobant ; `null` hors de tout gabarit. */
export const PageThemeContext = createContext<'light' | 'dark' | null>(null);

/** L'attribut du thème local, lu par les blocs de jetons d'`opale.css`. */
export const PAGE_THEME_ATTRIBUTE = 'data-opale-page-theme';

/* Marque les copies : un conteneur de portail thémé n'est pas un gabarit, et
   la recherche du gabarit du document (`ToastProvider`) ne doit pas le compter
   comme tel. */
export const PAGE_THEME_COPY_ATTRIBUTE = 'data-opale-page-theme-inherited';

/** Les attributs à poser sur la racine d'un portail pour un thème donné. */
export function pageThemeAttributes(
  theme: 'light' | 'dark' | null,
): Record<string, string> | undefined {
  if (theme === null) return undefined;
  return { [PAGE_THEME_ATTRIBUTE]: theme, [PAGE_THEME_COPY_ATTRIBUTE]: '' };
}
