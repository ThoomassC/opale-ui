import type { PropRow } from './api';

export interface CatalogApiDoc {
  readonly states: string;
  readonly rows: readonly PropRow[];
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
    ],
  },
  Checkbox: {
    states: 'Choix binaire natif, contrôlé ou initialisé par défaut.',
    rows: [
      prop('label', 'ReactNode', 'Nom de la case.'),
      prop('description', 'ReactNode', 'Précision associée au nom.'),
      prop('checked', 'boolean', 'État contrôlé par l’application.'),
    ],
  },
  Toggle: {
    states: 'Interrupteur pour un réglage activé ou désactivé.',
    rows: [
      prop('label', 'ReactNode', 'Nom visible de l’interrupteur.'),
      prop('checked', 'boolean', 'État contrôlé par l’application.'),
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
      prop('options', 'readonly { value: string; label: ReactNode }[]', 'Choix proposés.'),
      prop('helperText', 'ReactNode', 'Aide sous le sélecteur.'),
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
      prop('columns', 'readonly DataTableColumn[]', 'Colonnes, tri et alignement.'),
      prop('rows', 'readonly DataTableRow[]', 'Données affichées.'),
      prop('size', "'small' | 'medium'", 'Espacement des lignes.', 'medium'),
      prop('striped', 'boolean', 'Alternance discrète des lignes.', 'false'),
      prop('showRowCount', 'boolean', 'Nombre de lignes visibles sous la table.', 'false'),
      prop('sort', 'DataTableSort | null', 'Tri contrôlé ; null : sans tri.'),
      prop('defaultSort', 'DataTableSort', 'Tri initial, non contrôlé.'),
      prop('onSortChange', '(sort: DataTableSort) => void', 'Tri demandé par un clic d’en-tête.'),
      prop('rowKey', '(row, index) => string | number', 'Identité stable des lignes.'),
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
      prop('tone', "'primary' | 'accent' | 'danger'", 'Ton de la pastille.', 'primary'),
      prop('dot', 'boolean', 'Ajoute un point de notification.', 'false'),
    ],
  },
  Rating: {
    states: 'Affichage de note uniquement ; la valeur est arrondie au quart.',
    rows: [
      prop('value', 'number', 'Note affichée.', '0'),
      prop('max', 'number', 'Nombre d’étoiles du barème.', '5'),
    ],
  },
  RatingInput: {
    states: 'Choisir une note au clavier ou au pointeur.',
    rows: [
      prop('label', 'string', 'Nom du groupe de notation.', undefined, true),
      prop('value', 'number', 'Note contrôlée.'),
      prop('defaultValue', 'number', 'Note de départ, non contrôlée.', '0'),
      prop('onValueChange', '(value: number) => void', 'Nouvelle note.'),
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
    rows: [prop('links', 'readonly NavItem[]', 'Adresses et libellés des pages légales.')],
  },
  Heading: {
    states: 'Le niveau HTML détermine la place dans le plan de la page.',
    rows: [prop('level', '1 | 2 | 3 | 4', 'Niveau du titre.', '2')],
  },
  Text: {
    states: 'Corps, légende ou métrique selon le rôle du texte.',
    rows: [
      prop('variant', "'body' | 'label' | 'caption' | 'metric'", 'Rôle typographique.', 'body'),
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
      prop('message', 'ReactNode', 'Contenu de la notification.', undefined, true),
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
    rows: [prop('label', 'string', 'Action en cours annoncée.', 'Chargement')],
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
      prop('onConfirm', '() => void', 'Action confirmée.'),
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
    ],
  },
  Menu: {
    states: 'Le contenu se déplie dans le flux de la page.',
    rows: [
      prop('label', 'ReactNode', 'Libellé du contrôle.', 'Menu'),
      prop('items', 'readonly NavItem[]', 'Actions ou liens proposés.'),
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
    rows: [prop('items', 'readonly NavItem[]', 'Étapes du chemin.')],
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
    rows: [prop('selectedCount', 'number', 'Nombre d’éléments sélectionnés.', '0')],
  },
  Stack: {
    states: 'Empilement à espacement constant, éventuellement renvoyé à la ligne.',
    rows: [
      prop('direction', "'row' | 'column'", 'Axe des enfants.', 'column'),
      prop('wrap', 'boolean', 'Retour à la ligne.', 'false'),
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
      prop('selected', 'boolean', 'État de sélection.', 'false'),
      prop('onClick', '() => void', 'Bascule la sélection.'),
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
        'labels',
        'Partial<LightboxLabels>',
        'Textes de l’interface, clé par clé ; une clé omise garde son défaut français.',
        "{ close: 'Fermer', dialog: 'Aperçu' }",
      ),
    ],
  },
  Clipboard: {
    states: 'Copie confirmée seulement après réussite ; l’échec est annoncé.',
    rows: [prop('value', 'string', 'Texte à copier.', undefined, true)],
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
};
