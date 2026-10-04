/* =============================================================================
   LE VERRE EST LA PEAU, LE CONTRÔLE NATIF RESTE LE MOTEUR.

   C'est la règle qui gouverne les sept fusions de ce fichier, et elle mérite
   d'être posée une fois plutôt que réexpliquée sept.

   UN SEUL COMPOSANT PAR NOM, ET `liquidGlass` CHOISIT SA MATIÈRE.

   Le paquet publiait deux `Button`, deux `Input`, deux `Card`… : les siens, et
   ceux d'une librairie tierce dont le code était copié dans le dépôt. La prop
   `liquidGlass` ne posait qu'une classe — un lavis CSS qui imitait le verre
   sans l'être.

   ELLE REND DÉSORMAIS LE VRAI MATÉRIAU, ET CE MATÉRIAU EST LE NÔTRE.
   `Glass` (`./components/glass/Glass`) est écrit par Opale : trois couches —
   réfraction, lavis, filet spéculaire — et un contenu. Il ne reste aucune
   ligne de code tiers derrière cette prop.

   CE QUE CELA A SIMPLIFIÉ, ET C'EST LE VRAI GAIN. Une version précédente
   rendait le composant TIERS comme peau, par-dessus le contrôle d'Opale. Il
   fallait alors lui reprendre de force sa géométrie, sa typographie et ses
   couleurs, à coups de `!important`, parce que son module CSS était injecté
   après notre feuille. Chacun de ces rattrapages a coûté un défaut vu à
   l'écran : un bouton de 125 px au lieu de 100, une carte qui perdait 37 px,
   un texte indicatif blanc sur blanc, un interrupteur VERT au milieu d'une
   interface bleue, un badge qui passait ses libellés en capitales.

   Tout cela vient de disparaître, et pour une raison simple : le verre
   enveloppe désormais LE BALISAGE D'OPALE. `<Glass as="button"
   className="opale-button opale-button--primary">` est le bouton d'Opale — ses
   classes, sa silhouette, sa taille, son encre — posé sur nos trois couches.
   Il n'y a plus deux géométries à réconcilier, donc plus rien à forcer.

   LE CONTRÔLE NATIF RESTE LE MOTEUR, et cela n'a pas changé : là où un
   composant porte un état — case, interrupteur, curseur, sélecteur —, c'est
   l'élément natif qui garde le focus, le clavier, le nom de formulaire et son
   `ChangeEvent`. Le verre ne fait que l'habiller.
   ========================================================================== */

export * from './catalog/forms';
export * from './catalog/display';
export * from './catalog/feedback';
export * from './catalog/navigation';
export * from './catalog/layout';
export * from './catalog/modules';
export * from './catalog/svg-map';
export { Opale } from './opale-namespace';
export { Pagination, RatingInput, Skeleton } from './opale-extras';
export { COOKIE_CONSENT_KEY, readCookieConsent } from './catalog/cookie-consent';
export type { CookieConsent } from './catalog/cookie-consent';
export type {
  PaginationLabels,
  PaginationProps,
  RatingInputLabels,
  RatingInputProps,
  SkeletonProps,
} from './opale-extras';
