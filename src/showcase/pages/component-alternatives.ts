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
  'composants/opale-menu': {
    name: 'DropdownMenu',
    slug: 'composants/opale-dropdown-menu',
    when: 'Pour un menu d’actions au sens d’ARIA : flèches, recherche par lettre, cases à cocher et choix exclusifs, dans un portail contre son bouton. `Menu` est une liste de liens ou d’actions qui se déplie dans le flux.',
  },
  'composants/opale-dropdown-menu': {
    name: 'Menu',
    slug: 'composants/opale-menu',
    when: 'Pour quelques liens de navigation qui se déplient dans le flux de la page, sans rôle de menu ni portail. `DropdownMenu` sert aux actions choisies au clavier.',
  },
  'composants/opale-card-grid': {
    name: 'Grid',
    slug: 'composants/opale-grid',
    when: 'Pour une grille de n’importe quel contenu, en nombre de colonnes fixe ou à largeur minimale de piste, avec l’espacement de votre choix. `CardGrid` range des cartes, en pistes de 15 rem.',
  },
  'composants/opale-grid': {
    name: 'CardGrid',
    slug: 'composants/opale-card-grid',
    when: 'Pour ranger des cartes sans rien régler : les pistes de 15 rem et l’espacement sont déjà en place. `Grid` sert quand les colonnes ou l’espacement doivent changer.',
  },
  'composants/opale-tooltip': {
    name: 'Popover',
    slug: 'composants/opale-popover',
    when: 'Pour un contenu interactif — champ, bouton, lien — ou une information qu’on ne doit pas manquer : le panneau s’ouvre au clic, au clavier comme au toucher. `Tooltip` ne porte qu’une courte description, au survol et au focus.',
  },
  'composants/opale-popover': {
    name: 'Tooltip',
    slug: 'composants/opale-tooltip',
    when: 'Pour une courte description d’un bouton, montrée au survol et au focus, sans rien d’interactif. `Popover` s’ouvre au clic et accueille des champs et des boutons.',
  },
  'composants/opale-segmented-control': {
    name: 'RadioGroup',
    slug: 'composants/opale-radio-group',
    when: 'Pour un choix unique dans un formulaire : des radios natifs, une légende, une aide, une erreur annoncée et une valeur envoyée avec le formulaire. `SegmentedControl` bascule une vue, sans formulaire.',
  },
  'composants/opale-radio-group': {
    name: 'SegmentedControl',
    slug: 'composants/opale-segmented-control',
    when: 'Pour basculer entre deux à cinq vues d’un même contenu, en une rangée compacte de boutons. `RadioGroup` sert au choix d’un formulaire, avec légende et erreur.',
  },
  'composants/opale-input': {
    name: 'Textarea',
    slug: 'composants/opale-textarea',
    when: 'Pour un texte de plusieurs lignes — commentaire, description, message —, avec hauteur automatique et compteur de caractères. `Input` reçoit une valeur d’une ligne.',
  },
  'composants/opale-textarea': {
    name: 'Input',
    slug: 'composants/opale-input',
    when: 'Pour une valeur d’une ligne — nom, adresse, recherche —, avec icône et type natif (`email`, `number`…). `Textarea` reçoit un texte de plusieurs lignes.',
  },
};
