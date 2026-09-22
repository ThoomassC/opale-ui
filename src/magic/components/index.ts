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
   par Opale.

   `Glass` A ÉTÉ RETIRÉ DE CETTE LISTE, ET C'EST LE DERNIER DOUBLON. Il était
   publié comme un composant alors qu'il n'en est pas un : c'est le MATÉRIAU
   dont les autres sont faits. Tout ce qu'on pouvait en obtenir s'obtient
   désormais par `liquidGlass` sur le composant qu'on veut vraiment — un
   `Glass` nu ne rend qu'un rectangle translucide que rien ne remplit. Le
   module reste, il tourne à l'écran dès qu'on active le verre, et `opale.tsx`
   l'importe par chemin direct comme les sept autres modules internes ; il n'a
   simplement plus de nom public, donc plus de page à exiger.

   CES SEPT-LÀ N'AVAIENT PAS D'ÉQUIVALENT et sont donc restés : un rail de
   navigation permanent, une barre de page composée, un dialogue générique à
   portail, une file de notifications, un motif d'onglets ARIA, un champ de
   recherche et la navigation de site. */

/* LE JEU D'ICÔNES EST PUBLIÉ, SON RENDEUR NE L'EST PAS. `IconGlyph` dessine un
   tracé nu, sans nom accessible ni mise en forme : c'est la pièce interne
   d'`Opale.Icon`, et de la croix de `Modal`. La publier en ferait un composant
   du catalogue — donc une page à écrire, et un second chemin pour rendre une
   icône là où il n'en faut qu'un. */
export { OPALE_ICONS, ICON_NAMES, ICON_GROUPS, isOpaleIconName } from './icon';
export type { OpaleIconName, IconGroup } from './icon';
export * from './modal';
export * from './search-bar';
export * from './sidebar';
export * from './site-nav';
export * from './tabs';
export * from './toast';
export * from './topbar';
