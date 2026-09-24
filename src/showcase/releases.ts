/**
 * L'historique de la vitrine et ses points d'entrée immuables.
 *
 * Les archives sous `/versions/` sont des builds statiques produits depuis les
 * commits indiqués ici. Une version ne remplace donc jamais la précédente :
 * son application, ses routes et son code restent consultables tels quels.
 */
export interface ReleaseNote {
  readonly version: string;
  readonly publishedAt: string;
  readonly dateLabel: string;
  readonly summary: string;
  readonly changes: readonly string[];
  readonly breaking?: boolean;
  /** URL de l'application figée, ou fragment pour la version courante. */
  readonly appHref: string;
  /** Arbre Git immuable ayant produit l'archive. */
  readonly sourceHref: string;
}

const REPOSITORY_URL = 'https://github.com/ThoomassC/opale-ui';

/**
 * Du plus récent au plus ancien. L'ordre est celui de la page et de la
 * recherche visuelle : la première entrée est toujours la version courante.
 */
export const RELEASES: readonly ReleaseNote[] = [
  {
    version: '4.0.0',
    publishedAt: '2026-09-24',
    dateLabel: '24 septembre 2026',
    summary:
      'Un catalogue resserré qui tient ce qu’il annonce : chaque composant garde sa matière d’origine et son verre liquide, et la vitrine se lit sur un téléphone.',
    changes: [
      'Rupture : vingt-quatre composants qui ne portaient rien sont retirés du catalogue, dont Game, Map, StatusChip, ThemeToggle, Separator et les cinq boutons spécialisés (AddButton, SaveButton, ApproveButton, EditButton, DeleteButton).',
      'Rupture : Glass n’est plus exporté, le verre passe par la propriété liquidGlass. IconActionButton prend une icône par son nom (icon) au lieu de l’initiale de son libellé, et Lightbox exige un texte alternatif (alt).',
      'Chaque composant qui peint une surface accepte liquidGlass et rend sa version d’origine par défaut.',
      'Toast choisit un ton (neutral, success, warning, error, info) qui remplit la carte et l’une des six places de l’écran ; Rating se remplit au quart d’étoile ; 125 icônes Opale sont dessinées à la main, sans bibliothèque externe.',
      'DataTable se trie par ses en-têtes, Dropzone accepte le glisser-déposer, CookieBanner mémorise le choix et propose de refuser, Clipboard signale l’échec, InlineInput valide sur Entrée et rétablit sur Échap, Badge gagne un point de notification et Card ses quatre élévations.',
      'Chaque fiche du catalogue décrit ce que le composant fait réellement, et un test refuse désormais une fiche qui promettrait une fonction sans trace dans le code.',
      'Les jetons de fond et d’encre sont séparés, ce qui rend le thème sombre lisible.',
      'La vitrine tient à 320 px de large : sous 30 rem, la navigation devient un sommaire repliable.',
    ],
    breaking: true,
    appHref: '#/',
    sourceHref: `${REPOSITORY_URL}/tree/v4.0.0`,
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
    /* ARCHIVÉE À LA SORTIE DE LA 4.0.0. `#/` désignait la version courante :
       gardé, le lien de la 3.1.1 aurait ouvert la 4.0.0. Le build figé vient
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
    appHref: '#/',
    sourceHref: `${REPOSITORY_URL}/tree/codex/refonte-v3`,
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
