/**
 * L'historique de la vitrine et ses points d'entrée immuables.
 *
 * Les archives sous `/versions/` sont des builds statiques produits depuis les
 * commits indiqués ici. Une version ne remplace donc jamais la précédente :
 * son application, ses routes et son code restent consultables tels quels.
 */
export interface ReleaseSection {
  readonly title: string;
  readonly changes: readonly ReleaseChange[];
}

export interface ReleaseChange {
  readonly title: string;
  readonly detail: string;
  readonly links?: readonly { readonly label: string; readonly slug: string }[];
}

export interface ReleaseReplacement {
  readonly removed: readonly string[];
  readonly guidance: string;
  readonly slug?: string;
}

export interface ReleaseMigrationStep {
  readonly title: string;
  readonly before: string;
  readonly after: string;
}

export interface ReleaseNote {
  readonly version: string;
  readonly publishedAt: string;
  readonly dateLabel: string;
  readonly summary: string;
  readonly changes: readonly string[];
  readonly highlights?: readonly string[];
  /** Optional grouping for releases with a longer change list. */
  readonly sections?: readonly ReleaseSection[];
  readonly migration?: {
    readonly fromVersion: string;
    readonly steps: readonly ReleaseMigrationStep[];
  };
  readonly removedComponents?: readonly ReleaseReplacement[];
  readonly breaking?: boolean;
  /** URL de l'application figée, ou fragment pour la version courante. */
  readonly appHref: string;
  /** Arbre Git immuable ayant produit l'archive. */
  readonly sourceHref: string;
}

const V360_RELEASE_SECTIONS: readonly ReleaseSection[] = [
  {
    title: 'Une API unique, sans rupture',
    changes: [
      {
        title: 'Valeurs',
        detail:
          'Chaque composant à valeur accepte value, defaultValue et onValueChange : SegmentedControl, CommandPalette, Pagination, RatingInput, MultiSelect, Navbar, Sidebar et SiteNav. DataTable accepte un tri contrôlé.',
        links: [{ label: 'SegmentedControl', slug: 'composants/opale-segmented-control' }],
      },
      {
        title: 'Ouverture',
        detail:
          'Modal, ConfirmDialog, SidePanel, Lightbox, CommandPalette, Toast et CookieBanner signalent leur fermeture par onOpenChange(false). ConfirmDialog ne le fait jamais sur Confirmer.',
        links: [{ label: 'Modal', slug: 'composants/modal' }],
      },
      {
        title: 'Tailles et tons',
        detail:
          'Une seule échelle small, medium, large pour Modal, Topbar, PageScaffold et DataTable, et un seul tone pour Feedback et les toasts.',
      },
      {
        title: 'ref et attributs natifs',
        detail:
          'Chaque composant accepte ref, className, style, id, data-* et aria-*. Les champs les transmettent au contrôle natif, ce qui les rend utilisables avec react-hook-form.',
        links: [{ label: 'Input', slug: 'composants/opale-input' }],
      },
      {
        title: 'Libellés et langue',
        detail:
          'Treize composants acceptent labels pour traduire leurs textes d’interface, avec les libellés français par défaut. DataTable trie selon locale.',
        links: [{ label: 'DataTable', slug: 'composants/opale-data-table' }],
      },
      {
        title: 'Types et imports',
        detail:
          'Chaque composant exporte son type de props, et la documentation importe par nom. Le namespace Opale gagne Modal, Tabs, Sidebar, Topbar, SiteNav et ToastProvider.',
        links: [{ label: 'Installation', slug: 'installation' }],
      },
    ],
  },
  {
    title: 'Compatibilité',
    changes: [
      {
        title: 'Anciens noms conservés',
        detail:
          'onChange, page, values, activeItemId, onClose, onCancel, severity, density, OpaleUI et les autres restent acceptés et fonctionnent comme en 3.5 ; l’éditeur les barre et indique le nouveau nom.',
      },
      {
        title: 'Corrections visibles',
        detail:
          'CommandPalette accepte la saisie sans value, et MultiSelect affiche la value qu’on lui passe.',
      },
      {
        title: 'Opale ne doit rien à personne',
        detail:
          'Les composants vivent désormais dans leur propre dossier et leurs classes générées portent le préfixe opale-mod-. Les points d’entrée du paquet ne changent pas.',
      },
    ],
  },
];

const V360_RELEASE_MIGRATION = {
  fromVersion: '3.5.2',
  steps: [
    {
      title: 'Passer aux nouveaux noms (facultatif)',
      before: '<Pagination page={page} onChange={setPage} pageCount={8} />',
      after: '<Pagination value={page} onValueChange={setPage} pageCount={8} />',
    },
    {
      title: 'Fermer avec onOpenChange (facultatif)',
      before: '<Modal open={open} onClose={() => setOpen(false)} />',
      after: '<Modal open={open} onOpenChange={setOpen} />',
    },
  ],
} as const;

const V352_RELEASE_SECTIONS: readonly ReleaseSection[] = [
  {
    title: 'Un seul langage visuel',
    changes: [
      {
        title: 'Un seul jeu de jetons',
        detail:
          'SiteNav, sa bulle et SearchBar ne lisent plus que les jetons --opale-* : plus de barre teal au milieu d’une interface bleue, et la police d’Opale est posée sur chaque composant, quelle que soit celle de la page.',
        links: [{ label: 'SiteNav', slug: 'composants/site-nav' }],
      },
      {
        title: 'Encres qui suivent le thème',
        detail:
          'Le texte des boutons, des toasts et de la pagination reste lisible dans une section sombre d’une page claire, et inversement.',
        links: [{ label: 'Button', slug: 'composants/opale-button' }],
      },
      {
        title: 'Hauteurs communes',
        detail:
          'Boutons, champs, selects, boutons-icônes, pagination et SearchBar partagent --opale-control-sm, md et lg : un champ et le bouton voisin font tous deux 44 px.',
        links: [{ label: 'Form', slug: 'composants/opale-form' }],
      },
      {
        title: 'Échelle typographique',
        detail:
          'Six tailles --opale-text-* et trois interlignes --opale-leading-* remplacent vingt tailles écrites en dur.',
        links: [{ label: 'Typographie', slug: 'typographie' }],
      },
    ],
  },
  {
    title: 'Accessibilité',
    changes: [
      {
        title: 'Un seul anneau de focus',
        detail:
          'Même largeur et même décalage partout ; les liens de SiteNav et SearchBar ont désormais un anneau visible au clavier.',
      },
      {
        title: 'Contrastes au seuil',
        detail:
          'Bordure des champs, interrupteur éteint et texte d’avertissement atteignent les ratios WCAG sur les deux thèmes.',
        links: [{ label: 'Toggle', slug: 'composants/opale-toggle' }],
      },
      {
        title: 'Toasts sous une modale',
        detail:
          'Un toast lancé depuis une modale ouverte est annoncé et refermable. L’attribut data-opale-modal-exempt garde toute autre région vivante.',
        links: [{ label: 'Modal', slug: 'composants/modal' }],
      },
    ],
  },
];

const V351_RELEASE_SECTIONS: readonly ReleaseSection[] = [
  {
    title: 'Prête pour la production',
    changes: [
      {
        title: 'Next.js App Router',
        detail:
          'Le bundle porte la directive « use client » : les composants s’importent tels quels depuis un Server Component, sans enveloppe.',
      },
      {
        title: 'Types lisibles en nodenext',
        detail:
          'Les déclarations publiées nomment leurs fichiers en entier : un projet en moduleResolution node16 ou nodenext les lit sans erreur.',
      },
      {
        title: 'Polices en fichiers',
        detail:
          'Chivo et Bricolage Grotesque ne sont plus incorporées en base64 : opale.css passe de 379 à 232 kB et relie fonts.css, que votre bundler émet en woff2. Aucun import à ajouter.',
      },
      {
        title: 'Version installable et licence',
        detail:
          'Les tags v3.3.0, v3.4.0 et v3.5.0 sont publiés et le tag v4.0.0, posé par erreur sur un code antérieur, est retiré. Opale est sous licence MIT.',
        links: [{ label: 'Installation', slug: 'installation' }],
      },
    ],
  },
  {
    title: 'Corrections',
    changes: [
      {
        title: 'MultiSelect non contrôlé',
        detail:
          'Sans la prop values, la sélection est maintenant affichée et annoncée ; defaultValue est pris en compte.',
        links: [{ label: 'MultiSelect', slug: 'composants/opale-multi-select' }],
      },
      {
        title: 'Feedback en français',
        detail:
          'Sans titre, l’encart affiche Succès, Information, Attention ou Erreur au lieu du nom anglais de sa sévérité.',
        links: [{ label: 'Feedback', slug: 'composants/opale-feedback' }],
      },
      {
        title: 'Guide d’installation',
        detail:
          'La page Installation couvre les prérequis, la compilation à l’installation, les styles, le thème et Next.js.',
        links: [{ label: 'Installation', slug: 'installation' }],
      },
    ],
  },
];

const V350_RELEASE_SECTIONS: readonly ReleaseSection[] = [
  {
    title: 'SvgMap refondue',
    changes: [
      {
        title: 'Une vraie carte',
        detail:
          'L’appelant fournit un viewBox et des régions ; le composant gère la vue, le zoom, le déplacement, le cadrage animé et la sélection. Une couleur par région suffit pour une carte de chaleur ou un quiz.',
        links: [{ label: 'SvgMap', slug: 'composants/opale-svg-map' }],
      },
      {
        title: 'Des gestes qui ne piègent pas la page',
        detail:
          'Pincement, glissement, et molette avec Ctrl ou ⌘ : une molette nue laisse défiler la page et affiche la consigne. Au-delà de six pixels, un contact devient un déplacement et ne vaut plus sélection.',
      },
      {
        title: 'Clavier et lecteurs d’écran',
        detail:
          'Un seul arrêt de tabulation, des flèches qui mènent à la région voisine, Maj + flèches pour déplacer la vue, + et − pour zoomer sur la région qui a le focus. Le contour par défaut tient 3:1 dans les deux thèmes, et les états sont peints au-dessus des régions voisines.',
      },
      {
        title: 'Vue pilotable et commandes détachables',
        detail:
          'useSvgMapViewport partage la vue avec l’appelant — fitTo, zoomBy, reveal, reset — et SvgMapControls se branche à part. La carte existe en version originale et en verre liquide.',
      },
      {
        title: 'Cadrer sur un ensemble de régions',
        detail:
          'fitBounds cadre la vue sur une boîte englobante : un continent, un groupe de départements, une sélection.',
      },
      {
        title: 'Une plaque aux coins arrondis',
        detail:
          'L’anneau de focus suit l’arrondi de la plaque et non le rectangle du dessin, et les tracés ne débordent plus dans les coins.',
      },
    ],
  },
  {
    title: 'Vitrine',
    changes: [
      {
        title: 'La carte du monde',
        detail:
          'La page SvgMap gagne un carnet de voyage sur la carte du monde au 1:50 000 000, chargé à part pour ne pas alourdir la page.',
        links: [{ label: 'SvgMap', slug: 'composants/opale-svg-map' }],
      },
      {
        title: 'Le nom OpaleUI',
        detail:
          'Le nom de la librairie prend un O majuscule et s’écrit plus grand dans l’en-tête, en Chivo 700 ; le titre des onglets suit.',
      },
      {
        title: 'L’en-tête resserré',
        detail:
          'Le bouton de menu prend le même espacement que la bascule de thème et le sélecteur de langue.',
      },
    ],
  },
];

/* LA RUPTURE DE LA 3.5.0 : `SvgMap` n'est plus un cadre. `viewBox` et
   `regions` deviennent obligatoires, et la courbe décorative disparaît ; ce
   qu'on posait en enfants reste possible, dessiné par-dessus les régions. */
const V350_RELEASE_MIGRATION = {
  fromVersion: '3.4.0',
  steps: [
    {
      title: 'Donner le dessin à la carte',
      before: '<SvgMap>\n  <path d="…" />\n</SvgMap>',
      after:
        '<SvgMap\n  viewBox="0 0 613 585"\n  regions={[{ id: "75", path: "…", name: "Paris" }]}\n/>',
    },
  ],
} as const;

const V340_RELEASE_SECTIONS: readonly ReleaseSection[] = [
  {
    title: 'Navigation',
    changes: [
      {
        title: 'Sidebar retravaillée',
        detail:
          'Les icônes perdent leur tuile grise, l’entrée retenue prend la teinte d’Opale et un liseré qui se voit aussi rail replié, et les entrées repliées deviennent des vignettes carrées identiques. Le pied du rail ne laisse plus de point orphelin une fois replié.',
        links: [{ label: 'Sidebar', slug: 'composants/sidebar' }],
      },
      {
        title: 'Sidebar et SiteNav dans les deux matières',
        detail:
          'La Sidebar pliable et la SiteNav se montrent désormais en version originale et en verre liquide. La SiteNav en verre n’est plus un aplat bleu posé sur la photographie.',
        links: [
          { label: 'Sidebar', slug: 'composants/sidebar' },
          { label: 'SiteNav', slug: 'composants/site-nav' },
        ],
      },
    ],
  },
  {
    title: 'Composants corrigés',
    changes: [
      {
        title: 'Divider visible',
        detail:
          'Le séparateur occupe toute la largeur de son conteneur et trace un trait lisible dans les deux thèmes ; il tombait à 0 px dans une grille et ne contrastait qu’à 1,09:1 en sombre.',
        links: [{ label: 'Divider', slug: 'composants/opale-divider' }],
      },
      {
        title: 'Dropzone sous verre',
        detail:
          'Le verre ne perd plus contre la zone pleine : fond transparent, tirets et texte clairs. L’action de sélection passe en italique et se rapproche du titre.',
        links: [{ label: 'Dropzone', slug: 'composants/opale-dropzone' }],
      },
      {
        title: 'FileCard et Lightbox',
        detail:
          'Sous verre, la vignette de la carte de fichier redevient une surface. La visionneuse range sa croix en haut à droite, comme tout dialogue sans titre, et ferme par un Button tonal.',
        links: [
          { label: 'FileCard', slug: 'composants/opale-file-card' },
          { label: 'Lightbox', slug: 'composants/opale-lightbox' },
        ],
      },
    ],
  },
];

const V330_RELEASE_SECTIONS: readonly ReleaseSection[] = [
  {
    title: 'Créer une page avec Opale',
    changes: [
      {
        title: 'PageScaffold, un gabarit complet',
        detail:
          'Le nouveau composant assemble une marque, une navigation responsive, la barre de recherche Opale, un contenu principal et un pied de page avec copyright.',
        links: [{ label: 'PageScaffold', slug: 'composants/page-scaffold' }],
      },
      {
        title: 'Une page prête à personnaliser',
        detail:
          'Nom du site, liens, page courante, recherche, introduction, largeur, styles et zones remplaçables sont configurables par les propriétés et les slots.',
      },
    ],
  },
  {
    title: 'Navigation et accessibilité',
    changes: [
      {
        title: 'Menu mobile et repères sémantiques',
        detail:
          'Le menu s’ouvre au bouton, se ferme avec Échap ou après un choix et restaure le focus. Un clic extérieur referme aussi le menu.',
      },
      {
        title: 'Recherche branchable',
        detail:
          'La recherche utilise SearchBar, propose des suggestions personnalisables et soumet un formulaire GET natif ; un callback peut prendre le relais.',
      },
    ],
  },
  {
    title: 'Composants retouchés',
    changes: [
      {
        title: 'CommandPalette',
        detail: 'Une mise en page resserrée et une recherche plus directe.',
        links: [{ label: 'CommandPalette', slug: 'composants/opale-command-palette' }],
      },
      {
        title: 'CookieBanner et Toast',
        detail:
          'Le bandeau se place mieux ; les toasts centrent leur contenu, bougent plus doucement et précisent le survol de leur croix.',
      },
      {
        title: 'Navbar, DataTable, Modal et SegmentedControl en verre liquide',
        detail:
          'Un meilleur contraste sous le verre ; la modale en verre retrouve une teinte lisible.',
      },
      {
        title: 'IconActionButton et focus des champs',
        detail:
          'Le bouton-icône est retravaillé dans ses deux matières, et l’anneau de focus des champs suit leur arrondi.',
      },
    ],
  },
  {
    title: 'Vitrine',
    changes: [
      {
        title: 'La goutte d’Opale',
        detail:
          'Le logo devient une goutte en verre liquide, et le tag de version une pastille aux marges de la référence.',
      },
    ],
  },
];

const V320_RELEASE_SECTIONS: readonly ReleaseSection[] = [
  {
    title: 'Compatibilité et migration',
    changes: [
      {
        title: '28 exports retirés depuis la 3.1.1',
        detail:
          'Les alias, composants sans comportement propre et promesses non tenues quittent le catalogue. Le tableau de migration ci-dessous indique les remplacements possibles.',
      },
      {
        title: 'Trois API à adapter',
        detail:
          'Glass devient la propriété liquidGlass ; IconActionButton exige un label et reçoit icon ; Lightbox exige alt. Les exemples avant/après sont juste sous cette rubrique.',
        links: [
          { label: 'Card', slug: 'composants/opale-card' },
          { label: 'IconActionButton', slug: 'composants/opale-icon-action-button' },
          { label: 'Lightbox', slug: 'composants/opale-lightbox' },
        ],
      },
    ],
  },
  {
    title: 'Composants et interactions',
    changes: [
      {
        title: 'Le verre liquide reste optionnel',
        detail:
          'Les composants qui peignent une surface acceptent liquidGlass ; ils gardent leur matériau d’origine par défaut.',
        links: [{ label: 'Voir Card', slug: 'composants/opale-card' }],
      },
      {
        title: 'Notifications, notes et icônes enrichies',
        detail:
          'Toast propose cinq tons et six positions, Rating se remplit au quart d’étoile et Opale fournit 125 icônes dessinées à la main.',
        links: [
          { label: 'Toast', slug: 'composants/opale-toast' },
          { label: 'Rating', slug: 'composants/opale-rating' },
          { label: 'Icônes', slug: 'icones' },
        ],
      },
      {
        title: 'Des interactions qui fonctionnent',
        detail:
          'DataTable trie, Dropzone accepte le dépôt, CookieBanner mémorise le choix, Clipboard signale l’échec et InlineInput valide ou annule au clavier. Badge et Card gagnent leurs variantes documentées.',
        links: [
          { label: 'DataTable', slug: 'composants/opale-data-table' },
          { label: 'Dropzone', slug: 'composants/opale-dropzone' },
        ],
      },
    ],
  },
  {
    title: 'Documentation et qualité',
    changes: [
      {
        title: 'Des fiches fidèles au code',
        detail:
          'Chaque fiche décrit le comportement réel du composant et un test empêche les promesses sans implémentation.',
      },
      {
        title: 'Thème sombre lisible',
        detail: 'Les jetons de fond et d’encre sont séparés pour garder un contraste cohérent.',
        links: [{ label: 'Thèmes', slug: 'theming' }],
      },
      {
        title: 'Vitrine adaptée au téléphone',
        detail: 'La documentation tient à 320 px ; sous 30 rem, le sommaire devient repliable.',
      },
    ],
  },
  {
    title: 'Améliorations de recette',
    changes: [
      {
        title: 'Catalogue praticable',
        detail:
          'Les fiches exposent leur API et leurs états ; Button, Input et DataTable disposent de réglages dont le code suit l’aperçu.',
        links: [
          { label: 'Button', slug: 'composants/opale-button' },
          { label: 'DataTable', slug: 'composants/opale-data-table' },
        ],
      },
      {
        title: 'Trois composants supplémentaires',
        detail:
          'Skeleton, Pagination et RatingInput couvrent le chargement, les listes paginées et la saisie d’une note.',
        links: [
          { label: 'Skeleton', slug: 'composants/opale-skeleton' },
          { label: 'Pagination', slug: 'composants/opale-pagination' },
          { label: 'RatingInput', slug: 'composants/opale-rating-input' },
        ],
      },
      {
        title: 'États et fichiers mieux gérés',
        detail:
          'DataTable traite les lignes stables, le vide et le chargement ; Dropzone contrôle type, nombre et taille des fichiers ; FileCard devient statique sans action.',
        links: [
          { label: 'DataTable', slug: 'composants/opale-data-table' },
          { label: 'Dropzone', slug: 'composants/opale-dropzone' },
        ],
      },
      {
        title: 'Parcours et polices autonomes',
        detail:
          'L’accueil, les guides et le sommaire mobile facilitent l’accès au catalogue ; les polices sont servies localement.',
        links: [
          { label: 'Utilisation', slug: 'utilisation' },
          { label: 'Thèmes', slug: 'theming' },
        ],
      },
    ],
  },
];

/** Diff vérifié entre les exports publics des tags v3.1.1 et v3.2.0. */
export const V320_REMOVED_COMPONENTS: readonly ReleaseReplacement[] = [
  {
    removed: ['AddButton', 'SaveButton', 'ApproveButton', 'EditButton', 'DeleteButton'],
    guidance:
      'Utilisez Button ou IconActionButton ; ajoutez ConfirmDialog pour confirmer une suppression.',
    slug: 'composants/opale-button',
  },
  {
    removed: ['Carousel'],
    guidance: 'CardGrid couvre la grille statique ; aucun carrousel animé équivalent.',
    slug: 'composants/opale-card-grid',
  },
  { removed: ['FileUploader'], guidance: 'Utilisez Dropzone.', slug: 'composants/opale-dropzone' },
  {
    removed: ['SlidingIndicator'],
    guidance: 'Utilisez SegmentedControl.',
    slug: 'composants/opale-segmented-control',
  },
  {
    removed: ['ShapeBackground'],
    guidance: 'Utilisez Background avec sa propriété shape.',
    slug: 'composants/opale-background',
  },
  {
    removed: ['StatusChip', 'Http', 'Validation'],
    guidance: 'Utilisez Badge pour un état court ou Feedback pour un message.',
    slug: 'composants/opale-badge',
  },
  {
    removed: ['ThemeToggle', 'Sound'],
    guidance: 'Utilisez Toggle relié à l’état réel de votre application.',
    slug: 'composants/opale-toggle',
  },
  {
    removed: ['LanguageSelector'],
    guidance: 'Utilisez Select relié à votre système de traduction.',
    slug: 'composants/opale-select',
  },
  { removed: ['SettingsMenu'], guidance: 'Utilisez Menu.', slug: 'composants/opale-menu' },
  {
    removed: ['Map'],
    guidance: 'SvgMap couvre un SVG interactif ; aucun fond cartographique n’est fourni.',
    slug: 'composants/opale-svg-map',
  },
  { removed: ['Legend'], guidance: 'Utilisez une liste sémantique adaptée à la visualisation.' },
  {
    removed: ['PageContent', 'PageScaffold'],
    guidance: 'Composez la page avec Layout, Stack et les éléments HTML adaptés.',
    slug: 'composants/opale-layout',
  },
  { removed: ['Separator'], guidance: 'Utilisez Divider.', slug: 'composants/opale-divider' },
  { removed: ['Scrollbar'], guidance: 'Utilisez le défilement natif du navigateur.' },
  {
    removed: ['Toolbar'],
    guidance: 'Créez une barre d’outils adaptée avec le rôle et le clavier appropriés.',
  },
  {
    removed: ['I18n', 'LocalStore', 'RouteGuard'],
    guidance:
      'Ces responsabilités relèvent de la traduction, du stockage et du routeur de l’application.',
  },
  {
    removed: ['Game', 'Countdown'],
    guidance: 'Aucun équivalent Opale ; implémentez le comportement nécessaire dans l’application.',
  },
];

const V320_RELEASE_MIGRATION = {
  fromVersion: '3.1.1',
  steps: [
    {
      title: 'Activer le verre sur le composant',
      before: '<Glass><Card>Contenu</Card></Glass>',
      after: '<Card liquidGlass>Contenu</Card>',
    },
    {
      title: 'Nommer l’icône d’action',
      before: '<IconActionButton label="Partager" />',
      after: '<IconActionButton icon="share" label="Partager" />',
    },
    {
      title: 'Décrire l’image de la visionneuse',
      before: '<Lightbox src="/visuel.png" open />',
      after: '<Lightbox src="/visuel.png" alt="Aperçu du composant" open />',
    },
  ],
} as const;

const REPOSITORY_URL = 'https://github.com/ThoomassC/opale-ui';

/**
 * Du plus récent au plus ancien. L'ordre est celui de la page et de la
 * recherche visuelle : la première entrée est toujours la version courante.
 */
export const RELEASES: readonly ReleaseNote[] = [
  {
    version: '3.6.0',
    publishedAt: '2026-09-28',
    dateLabel: '28 septembre 2026',
    summary:
      'Une seule convention d’API pour les valeurs, l’ouverture, les tailles, les tons, les libellés et les refs, sans casser aucune application en 3.5.',
    sections: V360_RELEASE_SECTIONS,
    changes: V360_RELEASE_SECTIONS.flatMap((section) =>
      section.changes.map((change) => `${change.title} : ${change.detail}`),
    ),
    highlights: [
      'value, defaultValue et onValueChange partout.',
      'onOpenChange sur toutes les surimpressions.',
      'ref, labels et attributs natifs sur chaque composant.',
    ],
    migration: V360_RELEASE_MIGRATION,
    appHref: '#/',
    sourceHref: `${REPOSITORY_URL}/tree/recette`,
  },
  {
    version: '3.5.2',
    publishedAt: '2026-09-28',
    dateLabel: '28 septembre 2026',
    summary:
      'Un seul langage visuel : jetons, hauteurs, texte et focus communs à tous les composants, contrastes au seuil.',
    sections: V352_RELEASE_SECTIONS,
    changes: V352_RELEASE_SECTIONS.flatMap((section) =>
      section.changes.map((change) => `${change.title} : ${change.detail}`),
    ),
    highlights: [
      'Champs et boutons alignés au pixel, sur une échelle de hauteurs commune.',
      'Six tailles de texte, un seul anneau de focus.',
      'Toasts annoncés même sous une modale ouverte.',
    ],
    /* ARCHIVÉE À LA SORTIE DE LA 3.6.0, sur son tag. */
    appHref: '/versions/v3.5.2/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/v3.5.2`,
  },
  {
    version: '3.5.1',
    publishedAt: '2026-09-28',
    dateLabel: '28 septembre 2026',
    summary:
      'Opale s’installe en production : tag de version, Next.js App Router, types nodenext, polices en fichiers, licence MIT.',
    sections: V351_RELEASE_SECTIONS,
    changes: V351_RELEASE_SECTIONS.flatMap((section) =>
      section.changes.map((change) => `${change.title} : ${change.detail}`),
    ),
    highlights: [
      'Import direct depuis un Server Component Next.js.',
      'Types lisibles en nodenext, polices livrées en fichiers woff2.',
      'MultiSelect non contrôlé et Feedback corrigés.',
    ],
    /* ARCHIVÉE À LA SORTIE DE LA 3.5.2, sur son tag. */
    appHref: '/versions/v3.5.1/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/v3.5.1`,
  },
  {
    version: '3.5.0',
    publishedAt: '2026-09-27',
    dateLabel: '27 septembre 2026',
    summary:
      'SvgMap devient une vraie carte : zoom, déplacement, cadrage et sélection, au geste comme au clavier, dans les deux matières.',
    sections: V350_RELEASE_SECTIONS,
    changes: V350_RELEASE_SECTIONS.flatMap((section) =>
      section.changes.map((change) => `${change.title} : ${change.detail}`),
    ),
    highlights: [
      'SvgMap : régions, couleurs calculées, sélection et cadrage animé.',
      'Molette avec Ctrl ou ⌘, clavier complet, contour à 3:1 dans les deux thèmes.',
      'Rupture : viewBox et regions deviennent obligatoires.',
    ],
    migration: V350_RELEASE_MIGRATION,
    breaking: true,
    /* ARCHIVÉE À LA SORTIE DE LA 3.5.1, sur son tag. */
    appHref: '/versions/v3.5.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/v3.5.0`,
  },
  {
    version: '3.4.0',
    publishedAt: '2026-09-27',
    dateLabel: '27 septembre 2026',
    summary:
      'Des composants qui se voient dans les deux matières : Sidebar retravaillée, SiteNav en vrai verre, et quatre corrections de rendu.',
    sections: V340_RELEASE_SECTIONS,
    changes: V340_RELEASE_SECTIONS.flatMap((section) =>
      section.changes.map((change) => `${change.title} : ${change.detail}`),
    ),
    highlights: [
      'Sidebar : états plus lisibles, rail replié homogène et version verre liquide.',
      'SiteNav : version originale ajoutée, verre liquide sans aplat.',
      'Divider, Dropzone, FileCard et Lightbox corrigés.',
    ],
    /* ARCHIVÉE À LA SORTIE DE LA 3.5.0, sur le commit que la recette servait. */
    appHref: '/versions/v3.4.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/741a97feecab9b26ccbf7336b13f919744734ac4`,
  },
  {
    version: '3.3.0',
    publishedAt: '2026-09-26',
    dateLabel: '26 septembre 2026',
    summary: 'PageScaffold compose une page complète dans la direction visuelle d’Opale.',
    sections: V330_RELEASE_SECTIONS,
    changes: V330_RELEASE_SECTIONS.flatMap((section) =>
      section.changes.map((change) => `${change.title} : ${change.detail}`),
    ),
    highlights: [
      'PageScaffold assemble l’en-tête, la recherche, le contenu et le pied de page.',
      'Le menu mobile, les repères sémantiques et les suggestions de recherche sont intégrés.',
      'Chaque zone peut être configurée ou remplacée sans modifier le composant.',
    ],
    /* ARCHIVÉE À LA SORTIE DE LA 3.4.0. `#/` et la branche `recette` désignent
       désormais la 3.4.0 : gardés, le lien et la provenance de la 3.3.0
       auraient ouvert la version suivante. Le build figé vient du commit que
       la recette servait alors. */
    appHref: '/versions/v3.3.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/649162f74cf2be6c13d78158c181e626e7dc4cbe`,
  },
  {
    version: '3.2.0',
    publishedAt: '2026-09-24',
    dateLabel: '24 septembre 2026',
    summary:
      'Un catalogue resserré qui tient ce qu’il annonce : chaque composant garde sa matière d’origine et son verre liquide, et la vitrine se lit sur un téléphone.',
    sections: V320_RELEASE_SECTIONS,
    changes: V320_RELEASE_SECTIONS.flatMap((section) =>
      section.changes.map((change) => `${change.title} : ${change.detail}`),
    ),
    highlights: [
      'Migration : Glass devient liquidGlass ; IconActionButton et Lightbox évoluent.',
      'Composants : Toast, DataTable, Dropzone et les icônes gagnent des interactions.',
      'Qualité : API et états visibles, polices locales et sommaire mobile vérifiés.',
    ],
    migration: V320_RELEASE_MIGRATION,
    removedComponents: V320_REMOVED_COMPONENTS,
    breaking: true,
    appHref: '/versions/v3.2.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/de045eba2ea3a7f361e3e9ec9f39ad3a84a118bb`,
  },
  {
    version: '3.1.1',
    publishedAt: '2026-09-21',
    dateLabel: '21 septembre 2026',
    summary:
      'Opale porte ses propres composants et fait du verre liquide une option de chacun d’eux.',
    changes: [
      'Chaque composant du catalogue porte désormais le nom d’Opale — Button, Card, Input — au lieu du préfixe hérité de la bibliothèque de référence sur laquelle le catalogue avait été calqué.',
      'Un seul composant par nom : les sept doublons « original » et « verre liquide » sont fusionnés en Badge, Card, Checkbox, Input, Select, Slider et Toggle.',
      'Le verre liquide devient une propriété des composants (liquidGlass) et non un second jeu de composants : le commutateur change la matière, jamais la taille, la position ni le comportement.',
      'Sous verre, le contrôle natif reste le moteur : le champ garde son focus, son clavier, son nom de formulaire et son événement de changement.',
      'Les démonstrations de verre se posent sur un paysage, sans quoi le matériau n’a rien à réfracter et ne se voit pas.',
      'Rupture : les jetons CSS et les classes publiés prennent le préfixe opale-, et les exports nommés perdent le leur. Le chemin Opale.Button ne change pas.',
    ],
    breaking: true,
    /* ARCHIVÉE À LA SORTIE DE LA 3.2.0. `#/` désignait la version courante :
       gardé, le lien de la 3.1.1 aurait ouvert la 3.2.0. Le build figé vient
       de son tag, comme les archives qui la précèdent. */
    appHref: '/versions/v3.1.1/index.html',
    /* LE TAG ET NON LA BRANCHE. `feat/composants` avance à chaque commit :
       « le code qui a produit cette version » y désignerait autre chose demain,
       ce que le contrat de ce champ interdit. Un tag ne bouge pas — c'est
       d'ailleurs le même que celui qu'installe la commande affichée sur la
       page « Installation ». */
    sourceHref: `${REPOSITORY_URL}/tree/v3.1.1`,
  },
  {
    version: '3.0.0',
    publishedAt: '2026-09-18',
    dateLabel: '18 septembre 2026',
    summary:
      'Opale adopte un langage visuel unifié et étend son catalogue sans retirer les composants historiques.',
    changes: [
      'Ajout des tokens, layouts et primitives visuelles du catalogue Opale.',
      'Ajout des thèmes clair et sombre, avec le verre liquide activable composant par composant.',
      'Ajout de nouveaux composants Opale en conservant les exports existants.',
    ],
    breaking: true,
    /* ARCHIVÉE APRÈS COUP, AU MÊME DÉFAUT QUE LA 3.1.1 : `#/` ouvrait la
       version courante, et la source visait une branche. Le build figé vient
       de la pointe de `codex/refonte-v3` (438fc00) — ce que ce lien montrait,
       encore en 3.0.0, et le premier état dont le build garde ses jetons —,
       marquée depuis par le tag v3.0.0. */
    appHref: '/versions/v3.0.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/v3.0.0`,
  },
  {
    version: '2.1.0',
    publishedAt: '2026-09-18',
    dateLabel: '18 septembre 2026',
    summary:
      'La vitrine gagne un historique de versions et conserve chaque état publié sous une adresse indépendante.',
    changes: [
      'Ajout de la page « Notes de versions » dans la navigation.',
      'Ajout de snapshots utilisables pour les versions 0.1.0 à 2.0.0.',
      'La version courante reste à la racine : les anciennes versions ne sont jamais écrasées.',
    ],
    appHref: '/versions/v2.1.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/7a12202`,
  },
  {
    version: '2.0.0',
    publishedAt: '2026-09-14',
    dateLabel: '14 septembre 2026',
    summary: 'Le paquet devient Opale et adopte ses composants en verre liquide.',
    changes: [
      'Quatorze composants verre liquide sont publiés à la racine.',
      'La vitrine passe d’une charte unique à une documentation navigable.',
      'Rupture majeure : les composants maison de la 1.x ne sont plus exportés.',
    ],
    breaking: true,
    appHref: '/versions/v2.0.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/5bdefcf66ed2c77111c7bda0f363a58438430add`,
  },
  {
    version: '1.2.0',
    publishedAt: '2026-09-10',
    dateLabel: '10 septembre 2026',
    summary: 'Un bouton bulle et sa lentille arrivent sans modifier les API existantes.',
    changes: [
      'Ajout de la variante `bubble` de `Button`.',
      'Ajout de `GlassLens` et de la feuille optionnelle `lens.css`.',
      'Les consommateurs qui n’emploient pas ces nouveautés restent inchangés.',
    ],
    appHref: '/versions/v1.2.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/dec06e86dba0c0f4ab53b6563a57c6d8bf592355`,
  },
  {
    version: '1.1.0',
    publishedAt: '2026-09-09',
    dateLabel: '9 septembre 2026',
    summary: 'Le thème verre liquide devient une feuille optionnelle, sans déplacement de l’API.',
    changes: [
      'Ajout de `glass.css` et de l’axe de matériau optionnel.',
      'Les jetons, rôles, composants et classes de la 1.0 restent compatibles.',
      'La vitrine documente le coût et les replis du matériau.',
    ],
    appHref: '/versions/v1.1.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/20887408adf78c6320a320c8f3dfb74617dc4e45`,
  },
  {
    version: '1.0.0',
    publishedAt: '2026-09-09',
    dateLabel: '9 septembre 2026',
    summary: 'L’API du socle est déclarée stable après l’arrivée des composants partagés.',
    changes: [
      'Le vocabulaire de la palette et des composants est stabilisé.',
      'La vitrine devient une documentation par page.',
      'Les consommateurs de la 0.3.0 disposent d’un contrat stable.',
    ],
    appHref: '/versions/v1.0.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/e131e00cdc900a7a96588fe12a72889f8f2677cd`,
  },
  {
    version: '0.3.0',
    publishedAt: '2026-09-08',
    dateLabel: '8 septembre 2026',
    summary: 'Le socle accueille les composants portés du portfolio et la palette canonique.',
    changes: [
      'Ajout des composants partagés manquants.',
      'Adoption de la palette du portfolio et de la couche de matériaux.',
      'Le contrat exécutable mesure désormais le socle commun.',
    ],
    appHref: '/versions/v0.3.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/f41041ba51ed8ef215ff38e33e925bb92f97834c`,
  },
  {
    version: '0.2.0',
    publishedAt: '2026-09-06',
    dateLabel: '6 septembre 2026',
    summary: 'Les fonds clairs passent du gris écran à une surface papier mesurée.',
    changes: [
      'Révision des fonds clairs de la palette.',
      'Le contrat de couleur est recalibré sur ces nouvelles surfaces.',
    ],
    appHref: '/versions/v0.2.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/28c1a9e5b599e62f4892f1d9e0da3a0dead3a1a1`,
  },
  {
    version: '0.1.0',
    publishedAt: '2026-09-05',
    dateLabel: '5 septembre 2026',
    summary: 'Première version du socle UI commun, de ses jetons et de son contrat de couleur.',
    changes: [
      'Première palette mesurée et premières échelles publiées.',
      'Ajout du contrat exécutable et de la vitrine de référence.',
    ],
    appHref: '/versions/v0.1.0/index.html',
    sourceHref: `${REPOSITORY_URL}/tree/246ee0928d9f1cc3e7ceb26ab29b212097840822`,
  },
];

export const CURRENT_RELEASE = RELEASES[0];
