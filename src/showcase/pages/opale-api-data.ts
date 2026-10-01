import type { PropRow } from './api';

/** Une partie d'un composant composé (`PopoverContent`…), documentée sous son propre tableau. */
export interface CatalogPartDoc {
  /** Le nom de l'export : son type de props est `${name}Props`. */
  readonly name: string;
  readonly rows: readonly PropRow[];
}

export interface CatalogApiDoc {
  readonly states: string;
  readonly rows: readonly PropRow[];
  /** Les parties publiées sous leur nom, dans l'ordre où on les écrit. */
  readonly parts?: readonly CatalogPartDoc[];
}

function prop(
  name: string,
  type: string,
  description: string,
  defaultValue?: string,
  required = false,
): PropRow {
  return { name, type, description, defaultValue, required };
}

/** Les propriétés qui guident un premier usage ; le type public reste la référence complète. */
export const CATALOG_API: Readonly<Record<string, CatalogApiDoc>> = {
  Button: {
    states: 'Comparer les variantes, la taille et l’état de chargement.',
    rows: [
      prop(
        'variant',
        "'primary' | 'secondary' | 'accent' | 'danger' | 'tonal' | 'ghost' | 'text'",
        'Couleur et rôle visuel du bouton.',
        'primary',
      ),
      prop('size', "'small' | 'medium' | 'large'", 'Taille de la cible et du contenu.', 'medium'),
      prop('loading', 'boolean', 'Bloque l’action et affiche une progression.', 'false'),
    ],
  },
  Pressable: {
    states: 'Action discrète sans surface permanente.',
    rows: [prop('onClick', 'MouseEventHandler<HTMLButtonElement>', 'Action déclenchée au clic.')],
  },
  InlineInput: {
    states: 'Entrée valide, Échap annule la dernière modification.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible du champ.'),
      prop('onCommit', '(value: string) => void', 'Reçoit la valeur validée.'),
      prop('onCancel', '(value: string) => void', 'Reçoit la valeur rétablie.'),
    ],
  },
  Input: {
    states: 'Comparer aide, erreur, focus et désactivation.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible du champ.'),
      prop('helperText', 'ReactNode', 'Aide persistante sous le champ.'),
      prop('error', 'ReactNode', 'Erreur annoncée aux technologies d’assistance.'),
      prop(
        'size',
        "'small' | 'medium' | 'large'",
        'Hauteur alignée sur celle du `Button` de même taille.',
        'medium',
      ),
      prop(
        'controlClassName',
        'string',
        'Classe de plus sur le contrôle natif ; `className` va à l’enveloppe.',
      ),
    ],
  },
  Checkbox: {
    states: 'Choix binaire natif, contrôlé ou initialisé par défaut.',
    rows: [
      prop('label', 'ReactNode', 'Nom de la case.'),
      prop('description', 'ReactNode', 'Précision associée au nom.'),
      prop('checked', 'boolean', 'État contrôlé par l’application.'),
      prop(
        'size',
        'OpaleSize | number',
        'Taille de la case et du texte ; un nombre garde son sens natif.',
        'medium',
      ),
      prop(
        'controlClassName',
        'string',
        'Classe de plus sur le contrôle natif ; `className` va à l’enveloppe.',
      ),
    ],
  },
  Toggle: {
    states: 'Interrupteur pour un réglage activé ou désactivé.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible de l’interrupteur.'),
      prop('checked', 'boolean', 'État contrôlé par l’application.'),
      prop(
        'size',
        'OpaleSize | number',
        'Taille de l’interrupteur et du texte ; un nombre garde son sens natif.',
        'medium',
      ),
      prop(
        'controlClassName',
        'string',
        'Classe de plus sur le contrôle natif ; `className` va à l’enveloppe.',
      ),
    ],
  },
  Slider: {
    states: 'Valeur ajustable au pointeur et au clavier.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible du curseur.'),
      prop('value', 'number', 'Valeur contrôlée.'),
      prop('valueLabel', 'string', 'Valeur lisible affichée près du contrôle.'),
    ],
  },
  MultiSelect: {
    states: 'Plusieurs choix, avec état sélectionné annoncé.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible du groupe.'),
      prop('options', 'readonly { value: string; label: ReactNode }[]', 'Choix proposés.'),
      prop('value', 'readonly string[]', 'Valeurs sélectionnées, contrôlées.'),
      prop('defaultValue', 'readonly string[]', 'Sélection de départ, non contrôlée.'),
      prop(
        'onValueChange',
        '(value: string[]) => void',
        'Sélection complète après chaque bascule.',
      ),
    ],
  },
  Select: {
    states: 'Choix unique sur un contrôle natif.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible du sélecteur.'),
      prop(
        'options',
        'readonly SelectOption[]',
        'Choix proposés ; une option `disabled` reste visible sans pouvoir être choisie.',
      ),
      prop('helperText', 'ReactNode', 'Aide sous le sélecteur.'),
      prop(
        'onValueChange',
        '(value: string, event: ChangeEvent<HTMLSelectElement>) => void',
        'Valeur retenue à chaque choix, avant `onChange`.',
      ),
      prop('placeholder', 'string', 'Première option vide, choisie tant que rien ne l’est.'),
      prop(
        'size',
        'OpaleSize | number',
        'Hauteur alignée sur le `Button` ; un nombre garde son sens natif (rangées visibles).',
        'medium',
      ),
      prop(
        'controlClassName',
        'string',
        'Classe de plus sur le contrôle natif ; `className` va à l’enveloppe.',
      ),
    ],
  },
  Autocomplete: {
    states: 'Suggestions fournies par l’application dans la liste native.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible du champ.'),
      prop('options', 'readonly string[]', 'Suggestions textuelles.'),
    ],
  },
  Form: {
    states: 'Un formulaire natif qui garde la soumission et la validation du navigateur.',
    rows: [prop('onSubmit', 'FormEventHandler<HTMLFormElement>', 'Traite la soumission.')],
  },
  SegmentedControl: {
    states: 'Une seule option sélectionnée ; l’indicateur suit la sélection.',
    rows: [
      prop(
        'options',
        'readonly { value: string; label: ReactNode }[]',
        'Segments affichés.',
        undefined,
        true,
      ),
      prop('value', 'string | null', 'Segment actif, contrôlé.'),
      prop('defaultValue', 'string | null', 'Segment actif de départ, non contrôlé.'),
      prop('onValueChange', '(value: string) => void', 'Signale le segment choisi.'),
      prop(
        'size',
        "'small' | 'medium' | 'large'",
        'Taille du groupe et de ses segments.',
        'medium',
      ),
      prop('controlClassName', 'string', 'Classe de plus sur chaque bouton d’option.'),
    ],
  },
  IconActionButton: {
    states: 'Action à icône seule : le libellé doit nommer l’action.',
    rows: [
      prop('icon', 'OpaleIconName', 'Dessin de l’action.', 'more-horizontal'),
      prop('label', 'string', 'Nom accessible du bouton.', undefined, true),
      prop(
        'variant',
        "'primary' | 'secondary' | 'accent' | 'danger' | 'tonal' | 'ghost' | 'text'",
        'Couleur de l’action. Tonal par défaut pour une icône seule.',
        'tonal',
      ),
      prop('size', "'small' | 'medium' | 'large'", 'Taille de la cible.', 'medium'),
    ],
  },
  Card: {
    states: 'La surface conserve son niveau d’élévation dans les deux matériaux.',
    rows: [
      prop('title', 'ReactNode', 'Titre de la carte.'),
      prop('elevation', '0 | 1 | 2 | 3', 'Hauteur visuelle.', '1'),
      prop('actions', 'ReactNode', 'Actions dans l’en-tête.'),
    ],
  },
  CardGrid: {
    states: 'Les cartes se répartissent en colonnes selon la place disponible.',
    rows: [prop('children', 'ReactNode', 'Cartes placées dans la grille.')],
  },
  DataTable: {
    states: 'Cliquer un en-tête triable alterne les sens du tri.',
    rows: [
      prop(
        'columns',
        'readonly DataTableColumn<T>[]',
        'Colonnes : tri, alignement, `cell(row, index)` pour un rendu propre et `sortValue(row)` pour trier ce qui n’est pas du texte.',
      ),
      prop('rows', 'readonly T[]', 'Données affichées, typées par l’appelant.'),
      prop('size', "'small' | 'medium'", 'Espacement des lignes.', 'medium'),
      prop('striped', 'boolean', 'Alternance discrète des lignes.', 'false'),
      prop('showRowCount', 'boolean', 'Nombre de lignes visibles sous la table.', 'false'),
      prop('sort', 'DataTableSort | null', 'Tri contrôlé ; null : sans tri.'),
      prop('defaultSort', 'DataTableSort', 'Tri initial, non contrôlé.'),
      prop('onSortChange', '(sort: DataTableSort) => void', 'Tri demandé par un clic d’en-tête.'),
      prop('rowKey', '(row, index) => string | number', 'Clé React des lignes.'),
      prop(
        'getRowId',
        '(row, index) => DataTableRowId',
        'Identité d’une ligne pour la sélection ; à défaut `rowKey`, puis l’index.',
      ),
      prop('selectable', 'boolean', 'Ajoute une colonne de cases à cocher.', 'false'),
      prop('selectedIds', 'readonly DataTableRowId[]', 'Lignes cochées, contrôlées.'),
      prop('defaultSelectedIds', 'readonly DataTableRowId[]', 'Lignes cochées au départ.'),
      prop(
        'onSelectedIdsChange',
        '(ids: DataTableRowId[]) => void',
        'Sélection complète après chaque case cochée.',
      ),
      prop('loading', 'boolean', 'Affiche un état de chargement.', 'false'),
      prop(
        'labels',
        'Partial<DataTableLabels>',
        'Chargement, table vide, compte et annonce du tri ; remplace emptyMessage.',
        "{ empty: 'Aucune donnée à afficher.', … }",
      ),
      prop('locale', 'string | readonly string[]', 'Langue(s) du tri alphabétique.', "'fr'"),
    ],
  },
  DescriptionList: {
    states: 'Paires terme et description regroupées sémantiquement.',
    rows: [
      prop('items', 'readonly { term: ReactNode; description: ReactNode }[]', 'Paires affichées.'),
    ],
  },
  BulletList: {
    states: 'Liste native pour des éléments textuels ou riches.',
    rows: [prop('items', 'readonly ReactNode[]', 'Éléments de liste.')],
  },
  Badge: {
    states: 'Le point de notification reste accompagné d’un texte accessible.',
    rows: [
      prop(
        'tone',
        "'primary' | 'accent' | 'danger' | 'success' | 'warning' | 'error' | 'info' | 'neutral'",
        'Ton de la pastille ; `error` peint comme `danger`.',
        'primary',
      ),
      prop('size', "'small' | 'medium' | 'large'", 'Taille du texte et de la pastille.', 'medium'),
      prop('dot', 'boolean', 'Ajoute un point de notification.', 'false'),
    ],
  },
  Rating: {
    states: 'Affichage de note uniquement ; la valeur est arrondie au quart.',
    rows: [
      prop('value', 'number', 'Note affichée.', '0'),
      prop('max', 'number', 'Nombre d’étoiles du barème.', '5'),
      prop(
        'labels',
        'Partial<RatingLabels>',
        'Nom accessible de la note ; une clé omise garde son défaut français.',
        '{ value: (value, max) => `${value} sur ${max}` }',
      ),
    ],
  },
  RatingInput: {
    states: 'Choisir une note au clavier ou au pointeur.',
    rows: [
      prop('label', 'string', 'Nom du groupe de notation.', undefined, true),
      prop('value', 'number', 'Note contrôlée.'),
      prop('defaultValue', 'number', 'Note de départ, non contrôlée.', '0'),
      prop('onValueChange', '(value: number) => void', 'Nouvelle note.'),
      prop(
        'labels',
        'Partial<RatingInputLabels>',
        'Nom de chaque étoile ; une clé omise garde son défaut français.',
        '{ option: (value, max) => `${value} sur ${max}` }',
      ),
    ],
  },
  Pagination: {
    states: 'La page courante et les bornes sont annoncées.',
    rows: [
      prop('pageCount', 'number', 'Nombre de pages.', undefined, true),
      prop('value', 'number', 'Page courante, contrôlée.'),
      prop('defaultValue', 'number', 'Page de départ, non contrôlée.', '1'),
      prop('onValueChange', '(page: number) => void', 'Changement demandé.'),
      prop(
        'labels',
        'Partial<PaginationLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ previous: 'Page précédente', … }",
      ),
    ],
  },
  Skeleton: {
    states: 'Décoratif : le conteneur annonce le chargement.',
    rows: [
      prop('width', 'string | number', 'Largeur du repère.', '100%'),
      prop('height', 'string | number', 'Hauteur du repère.', '1rem'),
    ],
  },
  StatCard: {
    states: 'Métrique, valeur et variation sur une même surface.',
    rows: [
      prop('label', 'ReactNode', 'Nom de la métrique.', undefined, true),
      prop('value', 'ReactNode', 'Valeur principale.', undefined, true),
      prop('delta', 'ReactNode', 'Variation ou contexte.'),
    ],
  },
  Donut: {
    states: 'Visualisation d’une valeur de progression.',
    rows: [
      prop('value', 'number', 'Pourcentage représenté.', '60'),
      prop('label', 'string', 'Nom accessible de l’anneau.', '`${value}%`'),
    ],
  },
  LegalLinks: {
    states: 'Liens regroupés dans une navigation nommée.',
    rows: [
      prop('links', 'readonly NavItem[]', 'Adresses et libellés des pages légales.'),
      prop(
        'onNavigate',
        '(item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void',
        'Crochet du routeur : un clic gauche simple lui revient, les autres restent au navigateur.',
      ),
      prop(
        'labels',
        'Partial<LegalLinksLabels>',
        'Nom de la navigation ; une clé omise garde son défaut français.',
        "{ navigation: 'Liens légaux' }",
      ),
    ],
  },
  Heading: {
    states: 'Le niveau HTML détermine la place dans le plan de la page.',
    rows: [prop('level', '1 | 2 | 3 | 4 | 5 | 6', 'Niveau du titre.', '2')],
  },
  Text: {
    states: 'Corps, légende ou métrique selon le rôle du texte.',
    rows: [
      prop('variant', "'body' | 'label' | 'caption' | 'metric'", 'Rôle typographique.', 'body'),
      prop('as', "'p' | 'span' | 'div' | 'label'", 'Balise rendue.', 'p'),
      prop('htmlFor', 'string', 'Le contrôle nommé, avec `as="label"`.'),
    ],
  },
  Icon: {
    states: 'Une icône décorative reste masquée ; une icône informative reçoit un nom.',
    rows: [
      prop('name', 'OpaleIconName | ReactNode', 'Dessin ou nœud à rendre.', 'sparkle'),
      prop('label', 'string', 'Nom accessible si l’icône porte du sens.'),
    ],
  },
  Feedback: {
    states: 'Les erreurs sont annoncées de façon prioritaire.',
    rows: [
      prop('tone', "'success' | 'info' | 'warning' | 'error'", 'Nature du message.', 'info'),
      prop('title', 'ReactNode', 'Titre du retour.'),
    ],
  },
  Toast: {
    states: 'Notification pilotée par l’application dans le coin choisi de l’écran.',
    rows: [
      prop('message', 'ReactNode', 'Contenu de la notification.'),
      prop(
        'title',
        'ReactNode',
        'Titre, comme dans showToast ; avec message, reste l’infobulle HTML.',
      ),
      prop('description', 'ReactNode', 'Détail sous le titre, comme dans showToast.'),
      prop('open', 'boolean', 'Affiche ou masque le message.', 'true'),
      prop('onOpenChange', '(open: boolean) => void', 'Fermeture demandée par la croix.'),
      prop('tone', 'OpaleTone', 'Sens et couleur du message.', 'neutral'),
      prop('position', 'OpalePlacement', 'Position dans la fenêtre.', 'bottom-right'),
      prop(
        'labels',
        'Partial<ToastLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ close: 'Fermer la notification' }",
      ),
    ],
  },
  Spinner: {
    states: 'Progression indéterminée accompagnée d’un nom accessible.',
    rows: [
      prop('label', 'string', 'Action en cours annoncée.', 'Chargement'),
      prop('size', "'small' | 'medium' | 'large'", 'Taille du témoin : 16, 24 ou 40 px.', 'medium'),
    ],
  },
  ProgressBar: {
    states: 'Progression déterminée de 0 à 100.',
    rows: [
      prop('value', 'number', 'Valeur actuelle.', '0'),
      prop('label', 'string', 'Nom de la progression.'),
    ],
  },
  ConfirmDialog: {
    states: 'Confirmer ou annuler une action importante.',
    rows: [
      prop('open', 'boolean', 'État de la boîte.', 'false'),
      prop(
        'onConfirm',
        '() => void | PromiseLike<unknown>',
        'Action confirmée ; une promesse rendue met Confirmer en attente jusqu’à sa fin, Annuler reste possible.',
      ),
      prop('tone', "'default' | 'danger'", 'Rend Confirmer en bouton de danger.', 'default'),
      prop(
        'loading',
        'boolean',
        'Occupe le dialogue : Confirmer en chargement, fermeture refusée.',
        'false',
      ),
      prop(
        'onOpenChange',
        '(open: boolean) => void',
        'false sur Annuler, Échap, le voile ou la croix ; jamais sur Confirmer.',
      ),
      prop(
        'labels',
        'Partial<ConfirmDialogLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ cancel: 'Annuler', confirm: 'Confirmer', … }",
      ),
    ],
  },
  EmptyState: {
    states: 'Expliquer une absence de contenu et proposer la prochaine action.',
    rows: [
      prop('title', 'ReactNode', 'Nom de l’état vide.'),
      prop('description', 'ReactNode', 'Explication courte.'),
      prop('action', 'ReactNode', 'Action à effectuer ensuite.'),
    ],
  },
  Navbar: {
    states: 'Un seul élément est signalé comme page courante.',
    rows: [
      prop('items', 'readonly NavItem[]', 'Liens ou actions de navigation.'),
      prop('value', 'string | null', 'Identifiant de la page courante, contrôlé.'),
      prop('defaultValue', 'string | null', 'Page courante de départ, non contrôlée.'),
      prop('onValueChange', '(id: string) => void', 'Choix d’une entrée sans href.'),
      prop(
        'onNavigate',
        '(item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void',
        'Crochet du routeur pour les entrées avec href : un clic gauche simple lui revient.',
      ),
    ],
  },
  Menu: {
    states: 'Le contenu se déplie dans le flux de la page.',
    rows: [
      prop('label', 'ReactNode', 'Libellé du contrôle.', 'Menu'),
      prop('items', 'readonly NavItem[]', 'Actions ou liens proposés.'),
      prop(
        'onNavigate',
        '(item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void',
        'Crochet du routeur ; le menu se referme et rend le focus à son sommaire.',
      ),
    ],
  },
  Link: {
    states: 'Un lien natif, utilisable au clavier et ouvrable dans un nouvel onglet.',
    rows: [prop('href', 'string', 'Adresse de destination.')],
  },
  SidePanel: {
    states: 'Panneau latéral contrôlé, fermé par son appelant.',
    rows: [
      prop('open', 'boolean', 'Visibilité du panneau.', 'false'),
      prop('onOpenChange', '(open: boolean) => void', 'Demande de fermeture.'),
      prop(
        'labels',
        'Partial<SidePanelLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ close: 'Fermer', title: 'Panneau' }",
      ),
    ],
  },
  CommandPalette: {
    states: 'Recherche dans le contenu fourni ; le bouton Fermer accompagne onOpenChange.',
    rows: [
      prop('open', 'boolean', 'Visibilité de la palette.', 'false'),
      prop('value', 'string', 'Texte saisi, contrôlé.'),
      prop('defaultValue', 'string', 'Texte de départ, non contrôlé.', "''"),
      prop('onValueChange', '(value: string) => void', 'Nouveau texte saisi.'),
      prop(
        'onOpenChange',
        '(open: boolean) => void',
        'Ferme la palette avec la croix, le pied ou Échap.',
      ),
      prop(
        'footerClose',
        'boolean',
        'Rend le bouton Fermer du pied ; à false, seule la croix d’en-tête ferme.',
        'true',
      ),
      prop('children', 'ReactNode', 'Résultats ou commandes affichés sous la recherche.'),
      prop(
        'labels',
        'Partial<CommandPaletteLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ search: 'Rechercher une commande', … }",
      ),
    ],
  },
  Breadcrumb: {
    states: 'La dernière étape est annoncée comme page courante.',
    rows: [
      prop('items', 'readonly NavItem[]', 'Étapes du chemin.'),
      prop(
        'onNavigate',
        '(item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void',
        'Crochet du routeur : un clic gauche simple lui revient, les autres restent au navigateur.',
      ),
      prop(
        'labels',
        'Partial<BreadcrumbLabels>',
        'Nom du repère ; `aria-label` gagne. Une clé omise garde son défaut français.',
        "{ navigation: 'Fil d’Ariane' }",
      ),
    ],
  },
  CookieBanner: {
    states: 'En bas au centre, animé comme un toast ; le choix est mémorisé.',
    rows: [
      prop('open', 'boolean', 'Force l’affichage ou la fermeture.', 'choix mémorisé'),
      prop('onOpenChange', '(open: boolean) => void', 'false quand l’utilisateur choisit.'),
      prop('onAccept', '() => void', 'Consentement accepté.'),
      prop('onDecline', '() => void', 'Consentement refusé.'),
      prop('storageKey', 'string | null', 'Clé de persistance.', 'opale-cookie-consent'),
      prop(
        'labels',
        'Partial<CookieBannerLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ accept: 'Accepter', decline: 'Refuser', … }",
      ),
    ],
  },
  SelectionBar: {
    states: 'Les actions portent sur le nombre d’éléments sélectionnés.',
    rows: [
      prop('selectedCount', 'number', 'Nombre d’éléments sélectionnés.', '0'),
      prop(
        'labels',
        'Partial<SelectionBarLabels>',
        'Compte annoncé ; une clé omise garde son défaut français.',
        '{ count: (count) => `${count} sélectionné(s)` }',
      ),
    ],
  },
  Stack: {
    states: 'Empilement à espacement constant, éventuellement renvoyé à la ligne.',
    rows: [
      prop('direction', "'row' | 'column'", 'Axe des enfants.', 'column'),
      prop('wrap', 'boolean', 'Retour à la ligne.', 'false'),
      prop(
        'gap',
        "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'Espace entre les enfants, sur `--opale-space-*`.',
        'md',
      ),
      prop(
        'align',
        "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
        'Alignement sur l’axe secondaire.',
        'stretch',
      ),
      prop(
        'justify',
        "'start' | 'center' | 'end' | 'between'",
        'Répartition sur l’axe principal.',
        'start',
      ),
      prop('as', "'div' | 'section' | 'ul' | 'ol' | 'nav'", 'Balise rendue.', 'div'),
    ],
  },
  Layout: {
    states: 'Gabarit navigation et contenu principal.',
    rows: [prop('navigation', 'ReactNode', 'Contenu de la colonne de navigation.')],
  },
  Divider: {
    states: 'Séparateur horizontal sémantique sans état interactif.',
    rows: [prop('className', 'string', 'Classe de personnalisation visuelle.')],
  },
  BackgroundSurface: {
    states: 'Fond décoratif derrière le contenu.',
    rows: [prop('shape', 'boolean', 'Ajoute la forme organique.', 'false')],
  },
  FileCard: {
    states: 'Statique sans onClick ; sélectionnable et annoncée avec une action.',
    rows: [
      prop('name', 'string', 'Nom du fichier.', undefined, true),
      prop(
        'fileSize',
        'string',
        'Poids du fichier, tel qu’il s’affiche : « 2 Mo ». Remplace `size`.',
      ),
      prop('selected', 'boolean', 'État de sélection.', 'false'),
      prop('onClick', '() => void', 'Bascule la sélection.'),
      prop(
        'labels',
        'Partial<FileCardLabels>',
        'État sélectionné annoncé ; une clé omise garde son défaut français.',
      ),
    ],
  },
  Dropzone: {
    states: 'Dépôt par glisser-déposer ou sélection native.',
    rows: [
      prop('onFiles', '(files: FileList) => void', 'Fichiers validés.'),
      prop('accept', 'string', 'Types MIME ou extensions autorisés.'),
      prop('maxFiles', 'number', 'Nombre maximal par sélection.'),
      prop('maxSizeBytes', 'number', 'Taille maximale par fichier.'),
      prop('disabled', 'boolean', 'Désactive le dépôt et le sélecteur.', 'false'),
      prop(
        'labels',
        'Partial<DropzoneLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ select: 'Sélectionner des fichiers', … }",
      ),
    ],
  },
  Lightbox: {
    states: 'Visionneuse ouverte par l’application et fermée à la demande.',
    rows: [
      prop('src', 'string', 'Adresse de l’image.'),
      prop('alt', 'string', 'Description de l’image.', undefined, true),
      prop('open', 'boolean', 'Affiche la visionneuse.', 'false'),
      prop('onOpenChange', '(open: boolean) => void', 'Demande de fermeture.'),
      prop(
        'footerClose',
        'boolean',
        'Rend le bouton Fermer du pied ; à false, seule la croix d’en-tête ferme.',
        'true',
      ),
      prop(
        'labels',
        'Partial<LightboxLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ close: 'Fermer', dialog: 'Aperçu' }",
      ),
    ],
  },
  Clipboard: {
    states: 'Copie confirmée seulement après réussite ; l’échec est annoncé.',
    rows: [
      prop('value', 'string', 'Texte à copier.', undefined, true),
      prop(
        'labels',
        'Partial<ClipboardLabels> & Partial<ButtonLabels>',
        'Bouton au repos, après copie, annonce et échec ; une clé omise garde son défaut français.',
        "{ copy: 'Copier', copied: 'Copié', … }",
      ),
    ],
  },
  SvgMap: {
    states:
      'Carte image par défaut ; groupe de boutons avec `selectable`. Zoom, déplacement et cadrage, au geste comme au clavier.',
    rows: [
      prop(
        'viewBox',
        'string',
        'Vue d’ensemble du dessin, au format de l’attribut viewBox.',
        undefined,
        true,
      ),
      prop(
        'regions',
        'readonly SvgMapRegion[]',
        'Les tracés : un identifiant, un chemin, un nom.',
        undefined,
        true,
      ),
      prop('label', 'string', 'Nom de la carte, annoncé par les lecteurs d’écran.', "'Carte'"),
      prop('fill', '(id) => string | undefined', 'Couleur d’une région, appelée à chaque rendu.'),
      prop('stroke', 'string', 'Couleur du contour. Le défaut tient 3:1 dans les deux thèmes.'),
      prop(
        'selectable',
        'boolean',
        'Rend les régions cliquables et atteignables au clavier.',
        'false',
      ),
      prop('onSelect', '(id) => void', 'Appelé avec l’identifiant de la région désignée.'),
      prop(
        'selected',
        'readonly string[]',
        'Régions retenues : soulignées et annoncées aria-pressed.',
      ),
      prop('viewport', 'UseSvgMapViewportResult', 'Vue partagée, pour cadrer de l’extérieur.'),
      prop('maxZoom', 'number', 'Zoom maximal, en facteur de la vue d’ensemble.', '9'),
      prop('maxWidth', 'string', 'Largeur maximale ; la carte se centre au-delà.'),
      prop('maxHeight', 'string', 'Hauteur maximale, traduite en largeur au rapport du viewBox.'),
      prop('controls', 'boolean', 'Boutons de zoom intégrés.', 'true'),
      prop(
        'tapTolerance',
        'number',
        'Pixels au-delà desquels un contact devient un glissement.',
        '6',
      ),
      prop(
        'wheel',
        "'modifier' | 'always' | false",
        'Zoom à la molette : avec Ctrl ou ⌘, toujours, ou jamais.',
        "'modifier'",
      ),
      prop('overlay', 'ReactNode', 'Posé au-dessus de la carte : légende, consigne.'),
      prop('children', 'ReactNode', 'Dessin supplémentaire, dans les coordonnées de la carte.'),
      prop(
        'labels',
        'Partial<SvgMapLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ zoomIn: 'Zoomer', … }",
      ),
    ],
  },
  Textarea: {
    states:
      'La hauteur suit le texte avec `autoResize` ; le compteur décrit la limite et annonce le reste.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible du champ, rendu en `<label for>`.'),
      prop('helperText', 'ReactNode', 'Aide sous le champ ; l’erreur la remplace.'),
      prop('error', 'ReactNode', 'Erreur annoncée ; rend le champ invalide.'),
      prop(
        'autoResize',
        'boolean',
        'Fait grandir le champ avec son contenu, de `minRows` à `maxRows` lignes.',
        'false',
      ),
      prop('minRows', 'number', 'Lignes visibles au départ ; `rows` gagne.', '3'),
      prop(
        'maxRows',
        'number',
        'Avec `autoResize`, hauteur maximale en lignes ; au-delà, il défile.',
      ),
      prop(
        'showCount',
        'boolean',
        'Affiche le nombre de caractères ; avec `maxLength`, la limite et le reste.',
        'false',
      ),
      prop('maxLength', 'number', 'Limite native de caractères, lue par le compteur.'),
      prop(
        'onValueChange',
        '(value: string) => void',
        'Nouvelle valeur à chaque saisie, après `onChange`.',
      ),
      prop('size', "'small' | 'medium' | 'large'", 'Corps de texte et marges internes.', 'medium'),
      prop('controlClassName', 'string', 'Classe de plus sur le `<textarea>` natif.'),
      prop(
        'labels',
        'Partial<TextareaLabels>',
        'Textes du compteur, clé par clé ; une clé omise garde son défaut français.',
        '{ limit: (max) => `${max} caractères maximum`, … }',
      ),
    ],
  },
  RadioGroup: {
    states: 'Un seul choix coché ; les flèches passent d’un radio à l’autre.',
    rows: [
      prop('label', 'ReactNode', 'Légende du groupe : elle le nomme. Sans elle, `aria-label`.'),
      prop('options', 'readonly RadioOption[]', 'Choix rendus avant les `<Radio>` enfants.'),
      prop('helperText', 'ReactNode', 'Aide sous la légende ; elle décrit le groupe.'),
      prop('error', 'ReactNode', 'Erreur annoncée et décrite sur le groupe.'),
      prop('value', 'string', "Valeur cochée, contrôlée ; `''` ne coche rien."),
      prop('defaultValue', 'string', 'Valeur cochée au départ, rétablie par `form.reset()`.'),
      prop('onValueChange', '(value: string) => void', 'Valeur du radio qu’on vient de cocher.'),
      prop('name', 'string', 'Nom de formulaire de chaque radio. Généré par défaut.'),
      prop('orientation', "'vertical' | 'horizontal'", 'Disposition des choix.', 'vertical'),
      prop('size', "'small' | 'medium' | 'large'", 'Taille des ronds et du texte.', 'medium'),
      prop('required', 'boolean', 'Choix obligatoire : `required` sur chaque radio.', 'false'),
      prop('disabled', 'boolean', 'Désactive tout le groupe par le `<fieldset>` natif.'),
    ],
    parts: [
      {
        name: 'Radio',
        rows: [
          prop('value', 'string', 'Valeur envoyée quand ce radio est coché.', undefined, true),
          prop('label', 'ReactNode', 'Libellé : il nomme le radio.'),
          prop('description', 'ReactNode', 'Texte sous le libellé ; il décrit le radio.'),
          prop('controlClassName', 'string', 'Classe de plus sur l’`<input>` natif.'),
        ],
      },
    ],
  },
  Field: {
    states: 'Le libellé nomme le contrôle de l’application ; l’aide et l’erreur le décrivent.',
    rows: [
      prop(
        'children',
        'ReactNode | ((props: FieldControlProps) => ReactNode)',
        'Le contrôle. Une fonction reçoit `id` et `aria-*` à étaler ; un composant les lit par `useFieldProps()`.',
        undefined,
        true,
      ),
      prop('label', 'ReactNode', 'Libellé visible, en `<label for>` et `aria-labelledby`.'),
      prop(
        'description',
        'ReactNode',
        'Aide sous le contrôle ; elle reste affichée avec l’erreur.',
      ),
      prop('error', 'ReactNode', 'Erreur annoncée ; pose `aria-invalid` sur le contrôle.'),
      prop(
        'required',
        'boolean',
        '`aria-required` et marque `*` ; la validation native reste à poser.',
        'false',
      ),
      prop('id', 'string', 'Identifiant du contrôle, pas de l’enveloppe. Généré par défaut.'),
    ],
  },
  Grid: {
    states: 'Colonnes égales, ou autant de pistes que la largeur en permet.',
    rows: [
      prop(
        'columns',
        'number | string',
        "Un nombre de colonnes égales, ou une largeur minimale de piste (`'12rem'`).",
        '15 rem par piste',
      ),
      prop('gap', "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'", 'Espace entre les cellules.', 'md'),
    ],
  },
  Carousel: {
    states:
      'Glisser, flèches, points et clavier ; autoPlay se met en pause sous le pointeur et au focus.',
    rows: [
      prop(
        'label',
        'string',
        'Nom de la région : ce que le carrousel fait défiler.',
        undefined,
        true,
      ),
      prop('children', 'ReactNode', 'Les diapositives, des `CarouselSlide`.'),
      prop('value', 'number', 'Index de la première diapositive visible, contrôlé.'),
      prop('defaultValue', 'number', 'Index de départ, non contrôlé.', '0'),
      prop(
        'onValueChange',
        '(index: number) => void',
        'Changement de diapositive, voulu ou par défilement.',
      ),
      prop('slideSize', 'string', 'Largeur d’une diapositive, en longueur CSS.', 'min(78%, 22rem)'),
      prop(
        'gap',
        "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'Espace entre les diapositives.',
        'md',
      ),
      prop('showArrows', 'boolean', 'Affiche les flèches précédente et suivante.', 'true'),
      prop('showDots', 'boolean', 'Affiche un point par diapositive.', 'true'),
      prop(
        'autoPlay',
        'number',
        'Millisecondes entre deux diapositives ; boucle et rend un bouton pause. Jamais sous mouvement réduit.',
      ),
      prop('labels', 'Partial<CarouselLabels>', 'Textes français remplacés clé par clé.'),
    ],
    parts: [
      {
        name: 'CarouselSlide',
        rows: [
          prop('children', 'ReactNode', 'Le contenu de la diapositive.'),
          prop('aria-label', 'string', 'Remplace le nom « 2 sur 6 » posé par le carrousel.'),
        ],
      },
    ],
  },
  Reveal: {
    states:
      'Visible au repos ; monte à son entrée dans la vue (animation liée à la vue, sinon IntersectionObserver). Aucun mouvement sous mouvement réduit ni à l’impression.',
    rows: [
      prop('children', 'ReactNode', 'Le contenu qui monte.'),
      prop(
        'as',
        "'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'li' | 'figure'",
        'La balise rendue.',
        'div',
      ),
      prop('delay', 'number', 'Rang dans une cascade : × `--opale-reveal-stagger` (60 ms).'),
      prop(
        'once',
        'boolean',
        'Montre une fois sans recacher ; à `false`, le repli recache sous la vue.',
        'true',
      ),
    ],
  },
  Marquee: {
    states:
      'Défile en boucle ; se met en pause au bouton, sous le pointeur et au focus. Immobile au serveur, sans script, sous mouvement réduit et à l’impression.',
    rows: [
      prop(
        'label',
        'string',
        'Nom de la région : ce que le bandeau fait défiler.',
        undefined,
        true,
      ),
      prop(
        'children',
        'ReactNode',
        'Les entrées, en enfants directs ; sans `id`, elles sont rendues deux fois.',
      ),
      prop(
        'duration',
        'number',
        'Secondes pour une boucle complète (`--opale-marquee-duration`).',
        '28',
      ),
      prop('reverse', 'boolean', 'Défile dans l’autre sens.', 'false'),
      prop('gap', "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'", 'Espace entre deux entrées.', 'xl'),
      prop('fade', 'boolean', 'Estompe les deux bords du bandeau.', 'true'),
      prop('labels', 'Partial<MarqueeLabels>', 'Textes français remplacés clé par clé.'),
    ],
  },
  Tooltip: {
    states: 'Au survol après un délai, au focus tout de suite ; Échap la retire.',
    rows: [
      prop('content', 'ReactNode', 'Texte de la bulle : une description courte.', undefined, true),
      prop(
        'children',
        'ReactElement<TooltipTriggerProps>',
        'Le déclencheur : un seul élément focalisable, un `<button>` le plus souvent.',
        undefined,
        true,
      ),
      prop(
        'placement',
        "'top' | 'bottom' | 'left' | 'right'",
        'Côté préféré ; bascule si la place manque.',
        'top',
      ),
      prop('delay', 'number', 'Délai avant l’apparition au survol, en millisecondes.', '300'),
      prop('closeDelay', 'number', 'Délai avant la disparition, en millisecondes.', '100'),
      prop('offset', 'number', 'Écart avec le déclencheur, en pixels.', '8'),
      prop('open', 'boolean', 'Ouverture contrôlée.'),
      prop('defaultOpen', 'boolean', 'Ouverture initiale, non contrôlée.', 'false'),
      prop('onOpenChange', '(open: boolean) => void', 'Intention d’ouvrir ou de fermer.'),
    ],
  },
  Popover: {
    states: 'Le clic ouvre et ferme ; Échap et l’appui au dehors ferment.',
    rows: [
      prop('children', 'ReactNode', '`PopoverTrigger` et `PopoverContent`.'),
      prop('open', 'boolean', 'Ouverture contrôlée.'),
      prop('defaultOpen', 'boolean', 'Ouverture initiale, non contrôlée.', 'false'),
      prop('onOpenChange', '(open: boolean) => void', 'Intention d’ouvrir ou de fermer.'),
      prop('modal', 'boolean', 'Piège le focus et rend le reste de la page inerte.', 'false'),
    ],
    parts: [
      {
        name: 'PopoverTrigger',
        rows: [
          prop('className', 'string', 'Sans style propre : posez la classe d’un bouton.'),
          prop('children', 'ReactNode', 'Libellé du bouton ; il nomme aussi le panneau.'),
        ],
      },
      {
        name: 'PopoverContent',
        rows: [
          prop(
            'placement',
            "'top' | 'bottom' | 'left' | 'right'",
            'Côté préféré ; bascule si la place manque.',
            'bottom',
          ),
          prop('align', "'start' | 'center' | 'end'", 'Alignement sur le déclencheur.', 'center'),
          prop('offset', 'number', 'Écart avec le déclencheur, en pixels.', '8'),
          prop(
            'portalContainer',
            'HTMLElement | null',
            'Conteneur du portail ; `<body>` ou la couche de la modale.',
          ),
        ],
      },
    ],
  },
  DropdownMenu: {
    states:
      'Les flèches parcourent les éléments ; une lettre saute au suivant qui commence par elle.',
    rows: [
      prop('children', 'ReactNode', '`DropdownMenuTrigger` et `DropdownMenuContent`.'),
      prop('open', 'boolean', 'Ouverture contrôlée.'),
      prop('defaultOpen', 'boolean', 'Ouverture initiale, non contrôlée.', 'false'),
      prop('onOpenChange', '(open: boolean) => void', 'Intention d’ouvrir ou de fermer.'),
      prop(
        'onSelect',
        '(value: string) => void',
        '`value` de l’élément activé, quel que soit son genre.',
      ),
    ],
    parts: [
      {
        name: 'DropdownMenuContent',
        rows: [
          prop(
            'placement',
            "'top' | 'bottom' | 'left' | 'right'",
            'Côté préféré ; bascule si la place manque.',
            'bottom',
          ),
          prop('align', "'start' | 'center' | 'end'", 'Alignement sur le bouton.', 'start'),
          prop('offset', 'number', 'Écart avec le bouton, en pixels.', '4'),
        ],
      },
      {
        name: 'DropdownMenuItem',
        rows: [
          prop('value', 'string', 'Valeur passée au `onSelect` du menu.'),
          prop('onSelect', '() => void', 'Appelée à l’activation, avant la fermeture.'),
          prop('closeOnSelect', 'boolean', 'Referme le menu après l’activation.', 'true'),
          prop('disabled', 'boolean', 'Atteignable et lu, mais sans effet.', 'false'),
          prop('textValue', 'string', 'Texte de la recherche par lettre, pour un contenu riche.'),
        ],
      },
      {
        name: 'DropdownMenuCheckboxItem',
        rows: [
          prop('checked', 'boolean', 'Coché, contrôlé.'),
          prop('defaultChecked', 'boolean', 'Coché au départ, non contrôlé.', 'false'),
          prop('onCheckedChange', '(checked: boolean) => void', 'Nouvel état à chaque activation.'),
          prop('closeOnSelect', 'boolean', 'Referme le menu après l’activation.', 'false'),
        ],
      },
      {
        name: 'DropdownMenuRadioGroup',
        rows: [
          prop('label', 'ReactNode', 'Titre du groupe, affiché et lu comme son nom.'),
          prop('value', 'string', 'Option retenue, contrôlée.'),
          prop('defaultValue', 'string', 'Option retenue au départ, non contrôlée.'),
          prop('onValueChange', '(value: string) => void', 'Valeur de l’option activée.'),
        ],
      },
      {
        name: 'DropdownMenuRadioItem',
        rows: [
          prop('value', 'string', 'Valeur de l’option, retenue par le groupe.', undefined, true),
          prop('closeOnSelect', 'boolean', 'Referme le menu après l’activation.', 'false'),
        ],
      },
      {
        name: 'DropdownMenuGroup',
        rows: [prop('label', 'ReactNode', 'Titre du groupe, affiché et lu comme son nom.')],
      },
    ],
  },
};
