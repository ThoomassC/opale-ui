/* LE CATALOGUE DE LA VITRINE : une fiche par composant publié — son nom, sa
   famille et la phrase qui le présente. C'est une métadonnée de documentation,
   pas une pièce de l'interface : la vitrine et le contrat des fiches la lisent
   ici. Elle n'est plus publiée : `OPALE_CATALOG` et `CatalogEntry` ont été
   retirés en 4.0.0. */

/** Une fiche du catalogue de la vitrine. */
export interface ShowcaseCatalogEntry {
  readonly name: string;
  readonly category: string;
  readonly description: string;
}

/** Les fiches du catalogue, dans l’ordre de la vitrine. */
export const CATALOG: readonly ShowcaseCatalogEntry[] = [
  ['Button', 'Inputs', "Bouton d'action avec variantes, tailles et état de chargement."],
  [
    'Pressable',
    'Inputs',
    'Bouton sans fond, la variante texte de Button, pour un contenu cliquable.',
  ],
  ['InlineInput', 'Inputs', "Champ d'édition en place : Entrée valide, Échap rétablit."],
  ['Input', 'Inputs', "Champ de saisie avec libellé, icône, texte d'aide et erreur annoncée."],
  ['Checkbox', 'Inputs', 'Case à cocher avec label et sous-label décrit.'],
  ['Toggle', 'Inputs', 'Interrupteur animé pour les états binaires.'],
  ['Slider', 'Inputs', 'Curseur avec libellé, et valeur si on la lui fournit.'],
  ['MultiSelect', 'Inputs', 'Liste à choix multiples contrôlée, à la souris ou au clavier.'],
  ['Select', 'Inputs', "Sélecteur natif mono-valeur avec libellé et texte d'aide."],
  ['Autocomplete', 'Inputs', 'Champ à suggestions fournies, dans la liste native du navigateur.'],
  ['Form', 'Inputs', 'Formulaire natif, champs empilés en colonne.'],
  ['SegmentedControl', 'Inputs', 'Sélecteur segmenté animé pour choisir une option.'],
  [
    'IconActionButton',
    'Boutons spécialisés',
    "Bouton d'action à icône seule, nommé par son libellé.",
  ],
  [
    'Card',
    'Affichage de données',
    'Carte avec titre, sous-titre, actions, pied et quatre élévations.',
  ],
  ['CardGrid', 'Affichage de données', 'Grille responsive auto-adaptative pour cartes.'],
  ['DataTable', 'Affichage de données', 'Table de données triable par en-tête de colonne.'],
  ['DescriptionList', 'Affichage de données', 'Liste de paires libellé / valeur.'],
  ['BulletList', 'Affichage de données', "Liste à puces construite depuis un tableau d'éléments."],
  ['Badge', 'Affichage de données', 'Pastille de texte en trois tons, ou point de notification.'],
  ['Rating', 'Affichage de données', 'Note en étoiles, remplie au quart près.'],
  ['RatingInput', 'Inputs', 'Saisie accessible d’une note en étoiles.'],
  ['Pagination', 'Navigation', 'Pagination contrôlée avec page courante et bornes.'],
  ['Skeleton', 'Feedback', 'Espace réservé décoratif pendant un chargement.'],
  ['StatCard', 'Affichage de données', 'Carte de métrique avec libellé, valeur et variation.'],
  ['Donut', 'Affichage de données', 'Anneau de progression à une valeur, libellé au centre.'],
  ['LegalLinks', 'Affichage de données', 'Liens légaux regroupés dans une navigation.'],
  ['Heading', 'Affichage de données', "Titre de niveau 1 à 4 dans la police d'affichage."],
  ['Text', 'Affichage de données', 'Corps de texte, labels, légendes et métriques.'],
  ['Icon', 'Affichage de données', 'Icône Opale par son nom, ou nœud libre, libellé optionnel.'],
  ['Feedback', 'Feedback', 'Encart de message contextuel en quatre sévérités.'],
  ['Toast', 'Feedback', "Notification en cinq tons et six positions, fermée par l'appelant."],
  ['Spinner', 'Feedback', 'Indicateur de chargement circulaire.'],
  ['ProgressBar', 'Feedback', 'Barre de progression déterminée, de 0 à 100.'],
  ['ConfirmDialog', 'Feedback', "Boîte de dialogue de confirmation d'action."],
  ['EmptyState', 'Feedback', 'État vide illustré avec titre, description et action.'],
  ['Navbar', 'Navigation', 'Navigation en colonne, liens ou boutons, page courante signalée.'],
  ['Menu', 'Navigation', 'Menu dépliant dans le flux, avec items.'],
  ['Link', 'Navigation', 'Lien stylé sur la balise native.'],
  ['SidePanel', 'Navigation', 'Panneau latéral pleine hauteur, avec titre.'],
  [
    'CommandPalette',
    'Navigation',
    "Palette de commandes : un champ de recherche en modale, résultats fournis par l'appelant.",
  ],
  [
    'Breadcrumb',
    'Navigation',
    "Fil d'Ariane en liste ordonnée, dernière étape marquée page courante.",
  ],
  [
    'CookieBanner',
    'Navigation',
    'Bandeau de consentement qui mémorise le choix, accepté ou refusé.',
  ],
  ['SelectionBar', 'Navigation', "Barre d'actions groupées sur sélection multiple."],
  ['Stack', 'Mise en page', 'Empilement flexbox avec gaps issus des tokens.'],
  ['Layout', 'Mise en page', 'Gabarit de page avec navigation et contenu.'],
  ['Divider', 'Mise en page', 'Séparateur horizontal.'],
  [
    'BackgroundSurface',
    'Mise en page',
    'Fond de page aux dégradés du thème, forme décorative en option.',
  ],
  ['FileCard', 'Modules', 'Carte de fichier sélectionnable, avec nom et taille.'],
  ['Dropzone', 'Modules', 'Zone de dépôt par glisser-déposer, ou par le sélecteur natif.'],
  ['Lightbox', 'Modules', "Visionneuse d'image en modale, texte alternatif obligatoire."],
  ['Clipboard', 'Modules', 'Copie dans le presse-papier, état fugace et échec annoncé.'],
  [
    'SvgMap',
    'Modules',
    'Carte SVG interactive : zoom, déplacement, sélection et cadrage des régions.',
  ],
].map(([name, category, description]) => ({ name, category, description }));
