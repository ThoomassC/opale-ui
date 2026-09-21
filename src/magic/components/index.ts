/* LES COMPOSANTS D'OPALE.

   CE FICHIER A PERDU LA MOITIÉ DE SES PORTES, ET C'EST LE SUJET. Le paquet
   publiait deux `Button`, deux `Card`, deux `Input`, deux `Badge`, deux
   `Checkbox`, deux `Select`, deux `Slider` et deux contrôles binaires — les
   siens, et ceux d'une librairie tierce dont le code était copié dans le
   dépôt. Les doublons ont été fusionnés : il n'y a plus qu'un composant par
   nom, exporté par `../opale`, et sa prop `liquidGlass` choisit sa matière.

   LES MODULES TIERS N'ONT PAS ÉTÉ REFERMÉS, ILS ONT ÉTÉ SUPPRIMÉS. Fermer une
   porte en gardant la pièce laisse du code que personne ne relit, que rien ne
   teste, et qui continue de peser dans le dépôt. Ce qui reste ici est écrit
   par Opale, matériau `Glass` compris.

   CES HUIT-LÀ N'AVAIENT PAS D'ÉQUIVALENT et sont donc restés : un rail de
   navigation permanent, une barre de page composée, un dialogue générique à
   portail, une file de notifications, un motif d'onglets ARIA, un champ de
   recherche, la navigation de site et le matériau lui-même. */

export { Glass } from './glass';
export type { GlassProps } from './glass';

export * from './modal';
export * from './search-bar';
export * from './sidebar';
export * from './site-nav';
export * from './tabs';
export * from './toast';
export * from './topbar';
