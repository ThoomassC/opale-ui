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

const CURRENT_RELEASE_SECTIONS: readonly ReleaseSection[] = [
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
          'Glass devient la propriété liquidGlass ; IconActionButton reçoit icon et Lightbox exige alt. Les exemples avant/après sont juste sous cette rubrique.',
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
        title: 'Liquid Glass reste optionnel',
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
];

/** Diff vérifié entre les exports publics des tags v3.1.1 et v3.2.0. */
export const CURRENT_REMOVED_COMPONENTS: readonly ReleaseReplacement[] = [
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

const CURRENT_RELEASE_MIGRATION = {
  fromVersion: '3.1.1',
  steps: [
    {
      title: 'Activer le verre sur le composant',
      before: '<Glass><Opale.Card>Contenu</Opale.Card></Glass>',
      after: '<Opale.Card liquidGlass>Contenu</Opale.Card>',
    },
    {
      title: 'Nommer l’icône d’action',
      before: '<Opale.IconActionButton label="Partager" />',
      after: '<Opale.IconActionButton icon="share" label="Partager" />',
    },
    {
      title: 'Décrire l’image de la visionneuse',
      before: '<Opale.Lightbox src="/visuel.png" open />',
      after: '<Opale.Lightbox src="/visuel.png" alt="Aperçu du composant" open />',
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
    version: '3.2.0',
    publishedAt: '2026-09-24',
    dateLabel: '24 septembre 2026',
    summary:
      'Un catalogue resserré qui tient ce qu’il annonce : chaque composant garde sa matière d’origine et son verre liquide, et la vitrine se lit sur un téléphone.',
    sections: CURRENT_RELEASE_SECTIONS,
    changes: CURRENT_RELEASE_SECTIONS.flatMap((section) =>
      section.changes.map((change) => `${change.title} : ${change.detail}`),
    ),
    highlights: [
      'Migration : Glass devient liquidGlass ; IconActionButton et Lightbox évoluent.',
      'Composants : Toast, DataTable, Dropzone et les icônes gagnent des interactions.',
      'Qualité : les fiches, le thème sombre et la vitrine mobile sont vérifiés.',
    ],
    migration: CURRENT_RELEASE_MIGRATION,
    removedComponents: CURRENT_REMOVED_COMPONENTS,
    breaking: true,
    appHref: '#/',
    sourceHref: `${REPOSITORY_URL}/tree/v3.2.0`,
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
      'Ajout des thèmes clair et sombre, avec Liquid Glass activable composant par composant.',
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
    summary: 'Le paquet devient Opale et adopte les composants verre liquide vendorés.',
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
