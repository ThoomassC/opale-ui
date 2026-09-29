/* =============================================================================
   LES COMPOSANTS VOISINS, ET CE QUI LES SÉPARE.

   Certaines pages documentent deux réponses proches au même besoin. Chacune
   dit, en une phrase, quand préférer l'autre, et renvoie vers elle. La table
   est tenue par paires : la page A cite B, la page B cite A
   (`component-page.structure.test.tsx` le vérifie).

   La clé est le slug de la page qui affiche l'encadré ; `name` et `slug`
   désignent le composant voisin. `when` s'écrit en chaîne, `du code` entre
   accents graves.
   ========================================================================== */

export interface ComponentAlternative {
  /** Le composant voisin, tel qu'il s'importe. */
  readonly name: string;
  /** La page du composant voisin. */
  readonly slug: string;
  /** Quand le préférer, en une ou deux phrases. */
  readonly when: string;
}

export const COMPONENT_ALTERNATIVES: Readonly<Record<string, ComponentAlternative>> = {
  'composants/opale-toast': {
    name: 'ToastProvider',
    slug: 'composants/toast-provider',
    when: 'Pour une file de notifications déclenchées de n’importe où dans l’arbre par `useToast`, empilées et fermées après leur durée. `Toast` rend une seule notification en place, que votre état ouvre et ferme.',
  },
  'composants/toast-provider': {
    name: 'Toast',
    slug: 'composants/opale-toast',
    when: 'Pour une seule notification rendue en place, dont votre état décide l’ouverture, sans fournisseur ni file. `ToastProvider` sert quand plusieurs parties de l’application doivent notifier.',
  },
  'composants/modal': {
    name: 'ConfirmDialog',
    slug: 'composants/opale-confirm-dialog',
    when: 'Pour faire confirmer ou annuler une action : titre, message et boutons Annuler et Confirmer sont déjà en place. `Modal` accueille un contenu libre, dont vous composez le pied.',
  },
  'composants/opale-confirm-dialog': {
    name: 'Modal',
    slug: 'composants/modal',
    when: 'Pour un dialogue au contenu libre — formulaire, détail, média — dont vous composez le pied. `ConfirmDialog` ne sert qu’à confirmer ou annuler une action.',
  },
};
