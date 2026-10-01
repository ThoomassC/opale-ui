/* =============================================================================
   LE MANIFESTE DES JETONS : CE QU'UN HÔTE A LE DROIT DE SURCHARGER.

   Chaque jeton `--opale-*` déclaré sur `:root` dans `opale.css` a ici une
   ligne, et une seule : son groupe, son rôle en une phrase, et son statut.

   - `public` : une entrée stable en 2.x, faite pour être surchargée sur
     `:root` (et sur `:root[data-theme='dark']` pour le sombre) — marque,
     neutres, rayons, polices, espacement, hauteurs de contrôle, focus, plans.
   - `internal` : un dérivé ou une mécanique. Il peut changer de valeur ou de
     formule d'une version à l'autre ; le surcharger fige ce qu'Opale calcule.

   `tokens-manifest.test.ts` tient cette table contre la feuille dans les deux
   sens. La page « Personnaliser » de la vitrine en est générée, valeurs par
   défaut lues dans la feuille elle-même.
   ========================================================================== */

export type TokenStatus = 'public' | 'internal';

export type TokenGroup =
  | 'couleur'
  | 'encre'
  | 'surface'
  | 'etat'
  | 'focus'
  | 'rayon'
  | 'espacement'
  | 'hauteur'
  | 'texte'
  | 'police'
  | 'ombre'
  | 'mouvement'
  | 'verre'
  | 'z-index'
  | 'mecanique';

export interface TokenEntry {
  readonly name: `--opale-${string}`;
  readonly group: TokenGroup;
  readonly status: TokenStatus;
  /** Le rôle, en une phrase. */
  readonly role: string;
  /** La version depuis laquelle plus aucun composant ne lit le jeton. */
  readonly deprecatedSince?: string;
}

/** Les groupes, dans l'ordre de lecture de la page « Personnaliser ». */
export const TOKEN_GROUPS: readonly { readonly id: TokenGroup; readonly label: string }[] = [
  { id: 'couleur', label: 'Couleurs de marque' },
  { id: 'encre', label: 'Encres' },
  { id: 'surface', label: 'Surfaces et neutres' },
  { id: 'etat', label: 'États' },
  { id: 'focus', label: 'Focus' },
  { id: 'rayon', label: 'Rayons' },
  { id: 'espacement', label: 'Espacement' },
  { id: 'hauteur', label: 'Hauteurs de contrôle' },
  { id: 'texte', label: 'Échelle de texte' },
  { id: 'police', label: 'Polices' },
  { id: 'ombre', label: 'Ombres' },
  { id: 'mouvement', label: 'Mouvement' },
  { id: 'verre', label: 'Verre' },
  { id: 'z-index', label: 'Plans (z-index)' },
  { id: 'mecanique', label: 'Mécanique interne' },
];

const pub = (name: TokenEntry['name'], group: TokenGroup, role: string): TokenEntry => ({
  name,
  group,
  status: 'public',
  role,
});

const int = (name: TokenEntry['name'], group: TokenGroup, role: string): TokenEntry => ({
  name,
  group,
  status: 'internal',
  role,
});

export const OPALE_TOKENS: readonly TokenEntry[] = [
  /* La marque. */
  pub('--opale-primary', 'couleur', 'Fond des boutons pleins et couleur des actions.'),
  pub(
    '--opale-primary-dark',
    'couleur',
    'Primaire appuyé : survol et pression des boutons pleins.',
  ),
  pub(
    '--opale-primary-light',
    'couleur',
    'Primaire éclairci : lavis, et encre du primaire en sombre.',
  ),
  pub('--opale-secondary', 'couleur', 'Couleur secondaire, de la famille du primaire.'),
  pub('--opale-secondary-dark', 'couleur', 'Fond du bouton secondaire.'),
  pub('--opale-accent', 'couleur', 'Accent éditorial, un jaune vif qui porte une encre sombre.'),
  pub(
    '--opale-accent-dark',
    'couleur',
    'Accent sombre qui porte du blanc : pastille, lavis sur image.',
  ),
  pub('--opale-accent-ink', 'couleur', 'Accent quand il écrit du texte sur une surface.'),
  pub(
    '--opale-accent-graphic',
    'couleur',
    'Accent quand il dessine : étoiles, soleil du sélecteur.',
  ),
  pub('--opale-shade', 'couleur', 'Encre sombre qui assombrit un fond au survol.'),

  /* Les encres. */
  pub('--opale-text', 'encre', 'Encre du texte courant.'),
  pub('--opale-text-secondary', 'encre', 'Encre du texte d’appoint : aide, légende, méta.'),
  pub('--opale-on-fill', 'encre', 'Encre commune des remplissages pleins.'),
  pub('--opale-on-primary', 'encre', 'Encre sur le primaire ; vaut --opale-on-fill par défaut.'),
  pub(
    '--opale-on-secondary',
    'encre',
    'Encre sur le secondaire ; vaut --opale-on-fill par défaut.',
  ),
  pub('--opale-on-danger', 'encre', 'Encre sur le danger ; vaut --opale-on-fill par défaut.'),
  pub('--opale-on-accent', 'encre', 'Encre sombre posée sur l’accent, dans les deux thèmes.'),
  pub(
    '--opale-primary-on-surface',
    'encre',
    'Primaire qui écrit sur une surface ; à poser quand le primaire n’y tient pas 4,5:1.',
  ),

  /* Les surfaces. */
  pub('--opale-background', 'surface', 'Fond de la page.'),
  pub('--opale-surface', 'surface', 'Surface des cartes, champs et panneaux.'),
  pub('--opale-surface-base', 'surface', 'Surface de base, un cran sous la surface.'),
  pub('--opale-surface-sunken', 'surface', 'Surface creusée : pistes, zones en retrait.'),
  pub('--opale-divider', 'surface', 'Liseré qui sépare deux surfaces.'),
  pub('--opale-scrim', 'surface', 'Voile posé derrière les dialogues.'),
  pub('--opale-scrim-blur', 'surface', 'Flou du voile des dialogues.'),
  pub('--opale-disabled-opacity', 'surface', 'Opacité d’un contrôle désactivé.'),
  int('--opale-field-border', 'surface', 'Bord des champs, dérivé du texte et de la surface.'),

  /* Les états. */
  pub('--opale-success', 'etat', 'Couleur de signal du succès.'),
  pub('--opale-info', 'etat', 'Couleur de signal de l’information.'),
  pub('--opale-warning', 'etat', 'Couleur de signal de l’avertissement.'),
  pub('--opale-danger', 'etat', 'Couleur du danger : bouton destructif, erreur.'),
  pub('--opale-success-on-surface', 'etat', 'Succès qui écrit sur une surface ; suit le thème.'),
  pub('--opale-info-on-surface', 'etat', 'Information qui écrit sur une surface ; suit le thème.'),
  pub(
    '--opale-warning-on-surface',
    'etat',
    'Avertissement qui écrit sur une surface, plus sombre.',
  ),
  pub('--opale-danger-on-surface', 'etat', 'Danger qui écrit sur une surface ; suit le thème.'),
  int('--opale-fill-success', 'etat', 'Remplissage plein du succès, dérivé du ton.'),
  int('--opale-fill-warning', 'etat', 'Remplissage plein de l’avertissement, dérivé du ton.'),
  int('--opale-fill-danger', 'etat', 'Remplissage plein du danger, dérivé du ton.'),
  int('--opale-fill-info', 'etat', 'Remplissage plein de l’information, dérivé du ton.'),

  /* Le focus. */
  pub('--opale-focus', 'focus', 'Couleur de l’anneau de focus.'),
  pub('--opale-focus-ring-width', 'focus', 'Épaisseur de l’anneau de focus.'),
  pub('--opale-focus-ring-offset', 'focus', 'Écart entre l’anneau et le contrôle.'),

  /* Les rayons. */
  pub('--opale-radius-xs', 'rayon', 'Rayon des petits objets : drapeau, trait d’icône.'),
  pub('--opale-radius-sm', 'rayon', 'Rayon des petits contrôles.'),
  pub('--opale-radius-md', 'rayon', 'Rayon des cartes, champs et boutons.'),
  pub('--opale-radius-lg', 'rayon', 'Rayon des grandes surfaces : dialogue, panneau.'),
  pub('--opale-radius-pill', 'rayon', 'Rayon d’une pastille entièrement arrondie.'),
  int('--opale-squircle-radius', 'rayon', 'Rayon du contour doux des boutons, borné à 50 %.'),
  int('--opale-squircle-clip', 'rayon', 'Découpe du contour doux, calculée depuis son rayon.'),

  /* L'espacement. */
  pub('--opale-space-2xs', 'espacement', 'Pas d’espacement de 4 px.'),
  pub('--opale-space-xs', 'espacement', 'Pas d’espacement de 8 px.'),
  pub('--opale-space-sm', 'espacement', 'Pas d’espacement de 12 px.'),
  pub('--opale-space-md', 'espacement', 'Pas d’espacement de 16 px.'),
  pub('--opale-space-lg', 'espacement', 'Pas d’espacement de 24 px.'),
  pub('--opale-space-xl', 'espacement', 'Pas d’espacement de 36 px.'),
  pub('--opale-space-2xl', 'espacement', 'Pas d’espacement de 48 px.'),
  /* Les espacements des composants, réglés avec le reste de la densité. */
  pub('--opale-button-padding-block', 'espacement', 'Retrait vertical d’un bouton.'),
  pub('--opale-button-padding-inline', 'espacement', 'Retrait latéral d’un bouton moyen.'),
  pub('--opale-button-padding-inline-sm', 'espacement', 'Retrait latéral d’un petit bouton.'),
  pub('--opale-button-padding-inline-lg', 'espacement', 'Retrait latéral d’un grand bouton.'),
  pub('--opale-badge-gap', 'espacement', 'Écart entre l’icône et le texte d’une pastille.'),
  pub('--opale-badge-padding-inline', 'espacement', 'Retrait latéral d’une pastille.'),
  pub('--opale-stat-card-gap', 'espacement', 'Écart entre les lignes d’une carte de statistique.'),
  pub(
    '--opale-item-padding-inline',
    'espacement',
    'Retrait latéral d’un élément compact : segment, entrée, cellule.',
  ),
  pub(
    '--opale-nav-item-padding-block',
    'espacement',
    'Retrait vertical d’une entrée de navigation.',
  ),
  pub('--opale-stack-gap', 'espacement', 'Écart des lignes serrées d’une pile : options, étoiles.'),
  pub('--opale-cluster-gap', 'espacement', 'Écart d’une grappe de petites commandes.'),
  pub(
    '--opale-table-count-padding-inline',
    'espacement',
    'Retrait latéral du compteur d’un tableau.',
  ),
  pub(
    '--opale-table-state-padding-block',
    'espacement',
    'Retrait vertical de l’état vide ou de chargement d’un tableau.',
  ),
  pub(
    '--opale-description-row-gap',
    'espacement',
    'Écart entre deux lignes d’une liste de descriptions.',
  ),
  pub('--opale-list-indent', 'espacement', 'Retrait d’une liste à puces.'),
  pub(
    '--opale-command-option-gap',
    'espacement',
    'Écart entre deux options de la palette de commandes.',
  ),
  pub('--opale-toast-padding-block', 'espacement', 'Retrait vertical d’une notification.'),

  /* Les hauteurs de contrôle. */
  pub('--opale-control-sm', 'hauteur', 'Hauteur d’un contrôle compact.'),
  pub('--opale-control-md', 'hauteur', 'Hauteur d’un contrôle par défaut, cible de 44 px.'),
  pub('--opale-control-lg', 'hauteur', 'Hauteur d’un grand contrôle.'),

  /* L'échelle de texte. */
  pub('--opale-text-xs', 'texte', 'Taille de texte la plus petite : mentions.'),
  pub('--opale-text-sm', 'texte', 'Taille des libellés et du texte d’appoint.'),
  pub('--opale-text-md', 'texte', 'Taille du texte courant.'),
  pub('--opale-text-lg', 'texte', 'Taille d’un titre de carte.'),
  pub('--opale-text-xl', 'texte', 'Taille d’un titre de section.'),
  pub('--opale-text-2xl', 'texte', 'Taille d’un titre de page.'),
  pub('--opale-leading-tight', 'texte', 'Interligne serré des titres.'),
  pub('--opale-leading-snug', 'texte', 'Interligne des libellés et du texte court.'),
  pub('--opale-leading-relaxed', 'texte', 'Interligne du texte long.'),

  /* Les polices. */
  pub('--opale-font-body', 'police', 'Police du texte courant.'),
  pub('--opale-font-display', 'police', 'Police d’affichage des grands chiffres et accroches.'),
  pub('--opale-font-title', 'police', 'Police des titres.'),
  pub('--opale-font-mono', 'police', 'Police à chasse fixe du code.'),

  /* Les ombres. */
  pub('--opale-shadow-1', 'ombre', 'Élévation 1 : carte posée.'),
  pub('--opale-shadow-2', 'ombre', 'Élévation 2 : carte survolée, menu.'),
  pub('--opale-shadow-3', 'ombre', 'Élévation 3 : liste déroulante.'),
  pub('--opale-shadow-4', 'ombre', 'Élévation 4 : dialogue.'),
  pub('--opale-drop-shadow-1', 'ombre', 'Ombre portée 1, en filtre, pour les formes découpées.'),
  pub('--opale-drop-shadow-2', 'ombre', 'Ombre portée 2, en filtre, pour les formes découpées.'),

  /* Le mouvement. */
  pub('--opale-motion-instant', 'mouvement', 'Durée d’une réponse immédiate.'),
  pub('--opale-motion-fast', 'mouvement', 'Durée d’une transition courte : survol, appui.'),
  pub('--opale-motion', 'mouvement', 'Durée d’une transition par défaut.'),
  pub('--opale-motion-slow', 'mouvement', 'Durée d’une ouverture : panneau, dialogue.'),
  pub('--opale-motion-slower', 'mouvement', 'Durée d’une animation d’ambiance.'),
  pub('--opale-ease', 'mouvement', 'Courbe d’accélération standard.'),
  pub('--opale-ease-out', 'mouvement', 'Courbe de décélération des entrées.'),
  pub('--opale-ease-spring', 'mouvement', 'Courbe à léger rebond.'),
  pub('--opale-reveal-distance', 'mouvement', 'Montée d’un `Reveal` avant son entrée.'),
  pub(
    '--opale-reveal-duration',
    'mouvement',
    'Durée de la montée d’un `Reveal`, hors défilement natif.',
  ),
  pub(
    '--opale-reveal-stagger',
    'mouvement',
    'Pas d’une cascade de `Reveal`, multiplié par `delay`.',
  ),
  pub('--opale-ease-reveal', 'mouvement', 'Courbe de la montée d’un `Reveal`.'),
  pub('--opale-marquee-duration', 'mouvement', 'Période d’une boucle complète d’un `Marquee`.'),
  pub('--opale-split-distance', 'mouvement', 'Montée d’un mot de `SplitHeading` avant son entrée.'),
  pub('--opale-split-duration', 'mouvement', 'Durée de la montée d’un mot de `SplitHeading`.'),
  pub('--opale-split-stagger', 'mouvement', 'Pas de la cascade des mots d’un `SplitHeading`.'),

  /* Le verre. */
  pub('--opale-glass-ink', 'verre', 'Encre du texte posé sur le verre.'),
  pub('--opale-glass-ink-muted', 'verre', 'Encre atténuée du texte posé sur le verre.'),
  pub('--opale-glass-scrim', 'verre', 'Voile recommandé sous le verre pour que son encre se lise.'),
  int('--opale-glass-surface', 'verre', 'Remplissage translucide du verre.'),
  int('--opale-glass-border', 'verre', 'Liseré du verre.'),
  int('--opale-glass-shadow', 'verre', 'Ombre portée du verre.'),
  int('--opale-glass-backdrop-blur', 'verre', 'Flou de ce qui passe derrière le verre liquide.'),
  int('--opale-glass-saturate', 'verre', 'Saturation de ce qui passe derrière le verre liquide.'),
  int('--opale-glass-frost-blur', 'verre', 'Flou du verre dépoli.'),
  int('--opale-glass-frost-saturate', 'verre', 'Saturation du verre dépoli.'),
  int('--opale-glass-light', 'verre', 'Blanc fixe des reflets du verre.'),
  int('--opale-glass-deep', 'verre', 'Bleu nuit fixe des ombres du verre.'),
  int('--opale-glass-focus-halo', 'verre', 'Halo de focus à deux tons sur le verre.'),
  {
    ...int(
      '--opale-glass-blur',
      'verre',
      'Ancien flou du verre ; lire --opale-glass-backdrop-blur.',
    ),
    deprecatedSince: '2.7',
  },

  /* Les plans. */
  pub('--opale-z-sticky', 'z-index', 'Plan des barres collantes.'),
  pub('--opale-z-popover', 'z-index', 'Plan des listes déroulantes et infobulles.'),
  pub('--opale-z-overlay', 'z-index', 'Plan des bandeaux et voiles.'),
  pub('--opale-z-modal', 'z-index', 'Plan des dialogues.'),
  pub('--opale-z-toast', 'z-index', 'Plan des notifications, au-dessus des dialogues.'),

  /* La mécanique. */
  int('--opale-color-scheme', 'mecanique', 'Schéma de couleurs du thème, lu par .opale-root.'),
  int(
    '--opale-brand-mix-hover',
    'mecanique',
    'Part du primaire dans son survol dérivé (data-opale-brand).',
  ),
  int(
    '--opale-brand-mix-light',
    'mecanique',
    'Part du primaire dans son éclairci dérivé (data-opale-brand).',
  ),
  int(
    '--opale-brand-mix-secondary',
    'mecanique',
    'Part du secondaire dans le fond dérivé de son bouton.',
  ),
  int(
    '--opale-brand-mix-danger-ink',
    'mecanique',
    'Part du danger dans son encre dérivée sur surface.',
  ),
  int('--opale-tonal-mix', 'mecanique', 'Dosage du lavis des boutons tonals, réglé par thème.'),
];

/** Les jetons qu'un hôte peut surcharger, dans l'ordre du manifeste. */
export function publicTokens(): readonly TokenEntry[] {
  return OPALE_TOKENS.filter((entry) => entry.status === 'public');
}
