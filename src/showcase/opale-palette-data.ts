import type { Plate } from './palette-data';

/* =============================================================================
   LA PALETTE QUI PEINT RÉELLEMENT LE SITE.

   POURQUOI UN SECOND JEU DE PLAQUES, ET NON UNE RÉÉCRITURE DU PREMIER.
   `palette-data.ts` documente les rôles de `src/tokens/roles.css` — le teal et
   le cuivre de la 2.x. Ces valeurs ne sont PAS périmées : `tokens.css` est un
   artefact publié (`exports["./tokens.css"]`), donc ces rôles sont exactement
   ce qu'installe un consommateur du paquet, et 172 tests les tiennent contre
   la feuille. Les effacer aurait supprimé une information vraie.

   Seulement, ce n'est plus ce que la VITRINE rend. Depuis la V3, tout ce qu'on
   voit à l'écran est peint par les jetons `--opale-*` : un saphir à la place du
   teal, un sol crème, une olive et un ambre. La page de palette annonçait donc
   une marque que le site n'affichait plus — le même défaut que la page de
   typographie, qui promettait trois polices système alors que Chivo et
   Bricolage Grotesque arrivaient de Google Fonts.

   Les deux jeux cohabitent donc, dans cet ordre : d'abord ce qu'on voit,
   ensuite ce qu'on installe.

   LES HEXADÉCIMAUX SONT LITTÉRAUX, POUR LA MÊME RAISON QUE DANS L'AUTRE
   FICHIER : une plaque documente UN thème et doit le montrer quel que soit
   celui que le lecteur a choisi. Une pastille en `var(--opale-primary)` ne
   montrerait jamais qu'une moitié de la palette.

   ET ILS SONT TENUS PAR UN TEST, pour la raison que `palette-data.ts` a apprise
   à ses dépens : une valeur écrite à la main sans garde diverge de la feuille
   sans que rien ne proteste. `opale-palette-data.test.ts` relit `opale.css` et
   compare chaque valeur au jeton déclaré, thème par thème.

   AUCUN RATIO N'EST RECOPIÉ ICI. `opale.css` n'en documente pas, et inventer un
   chiffre serait pire que de n'en donner aucun. Le test les CALCULE avec
   `contrastRatio` du contrat de couleur et vérifie les paires qui portent du
   texte ; la page, elle, n'en affiche aucun plutôt qu'un chiffre non mesuré.
   ========================================================================== */

/** Le sol, la surface et l'encre d'un thème — ce sur quoi tout le reste se pose. */
const LIGHT = {
  ground: '#f7f4ef',
  ink: '#14100b',
  inkMuted: '#5c574d',
  rule: '#e6e1d8',
} as const;

const DARK = {
  ground: '#0c0f0d',
  ink: '#f3f1ec',
  inkMuted: '#b8b3a7',
  rule: '#2c322d',
} as const;

export const OPALE_PLATES: readonly Plate[] = [
  {
    id: 'opale-light',
    theme: 'light',
    title: 'Opale — thème clair',
    groundLabel: 'sol #f7f4ef',
    ground: LIGHT.ground,
    ink: LIGHT.ink,
    inkMuted: LIGHT.inkMuted,
    rule: LIGHT.rule,
    groups: [
      {
        title: 'Le saphir',
        note: 'L’encre des actions : boutons, liens, onglet courant, entrée active du sommaire.',
        swatches: [
          { token: '--opale-primary', hex: '#315c9e', against: 'encre des actions' },
          { token: '--opale-primary-dark', hex: '#23457a', against: 'appui et survol soutenu' },
          { token: '--opale-primary-light', hex: '#5f87c4', against: 'lavis et états atténués' },
        ],
      },
      {
        title: 'Les encres secondaires',
        note: 'Le bleu d’acier et l’ambre accompagnent ; ils ne portent jamais l’action principale.',
        swatches: [
          { token: '--opale-secondary', hex: '#5990b0', against: 'variante secondaire' },
          { token: '--opale-secondary-dark', hex: '#3a6b8a', against: 'fond du bouton secondaire' },
          { token: '--opale-accent', hex: '#f4ad15', against: 'accent éditorial' },
        ],
      },
      {
        title: 'Les encres d’état',
        note: 'Elles ne signifient jamais seules : chaque emploi porte un mot et un glyphe.',
        swatches: [
          { token: '--opale-info', hex: '#1a4f8b', against: 'information' },
          { token: '--opale-success', hex: '#2e7d32', against: 'succès' },
          { token: '--opale-warning', hex: '#b26a00', against: 'avertissement' },
          { token: '--opale-danger', hex: '#b3261e', against: 'erreur, action destructrice' },
        ],
      },
      {
        title: 'Les sols et les encres',
        note: 'Trois surfaces empilées du sol vers la carte, et deux encres.',
        swatches: [
          { token: '--opale-background', hex: '#f7f4ef', against: 'le sol de la page' },
          { token: '--opale-surface', hex: '#ffffff', against: 'la carte, posée sur le sol' },
          { token: '--opale-surface-base', hex: '#fbfaf9', against: 'surface intermédiaire' },
          { token: '--opale-surface-sunken', hex: '#efebe4', against: 'creux : piste, champ' },
          { token: '--opale-text', hex: '#14100b', against: 'texte courant' },
          { token: '--opale-text-secondary', hex: '#5c574d', against: 'méta, libellé, aide' },
          { token: '--opale-divider', hex: '#e6e1d8', against: 'filet et contour au repos' },
        ],
      },
    ],
  },
  {
    id: 'opale-dark',
    theme: 'dark',
    title: 'Opale — thème sombre',
    groundLabel: 'sol #0c0f0d',
    ground: DARK.ground,
    ink: DARK.ink,
    inkMuted: DARK.inkMuted,
    rule: DARK.rule,
    groups: [
      {
        title: 'Le saphir',
        note: 'Éclairci sur fond sombre : un bleu de plein jour y tomberait sous le seuil.',
        swatches: [
          { token: '--opale-primary', hex: '#5d87cb', against: 'encre des actions' },
          { token: '--opale-primary-dark', hex: '#739cda', against: 'appui — plus CLAIR ici' },
          { token: '--opale-primary-light', hex: '#a9c7f4', against: 'lavis et états atténués' },
        ],
      },
      {
        title: 'Les encres secondaires',
        note: 'L’ambre ne change pas de thème : il tient sur les deux sols.',
        swatches: [
          { token: '--opale-secondary', hex: '#8fb5cd', against: 'variante secondaire' },
          { token: '--opale-secondary-dark', hex: '#6f9cba', against: 'fond du bouton secondaire' },
          { token: '--opale-accent', hex: '#f4ad15', against: 'accent — identique au clair' },
        ],
      },
      {
        title: 'Les encres d’état',
        note: 'Seule l’erreur est éclaircie ; les trois autres tiennent déjà sur le sol sombre.',
        swatches: [
          { token: '--opale-info', hex: '#1a4f8b', against: 'information — hérité du clair' },
          { token: '--opale-success', hex: '#2e7d32', against: 'succès — hérité du clair' },
          { token: '--opale-warning', hex: '#b26a00', against: 'avertissement — hérité du clair' },
          { token: '--opale-danger', hex: '#e2726b', against: 'erreur, action destructrice' },
        ],
      },
      {
        title: 'Les sols et les encres',
        note: 'Le sombre inverse l’empilement : la carte est plus CLAIRE que le sol.',
        swatches: [
          { token: '--opale-background', hex: '#0c0f0d', against: 'le sol de la page' },
          { token: '--opale-surface', hex: '#262c27', against: 'la carte, posée sur le sol' },
          { token: '--opale-surface-base', hex: '#1d221e', against: 'surface intermédiaire' },
          { token: '--opale-surface-sunken', hex: '#121713', against: 'creux : piste, champ' },
          { token: '--opale-text', hex: '#f3f1ec', against: 'texte courant' },
          { token: '--opale-text-secondary', hex: '#b8b3a7', against: 'méta, libellé, aide' },
          { token: '--opale-divider', hex: '#2c322d', against: 'filet et contour au repos' },
        ],
      },
    ],
  },
];

/**
 * Les paires qui portent du TEXTE, et le seuil qu'elles doivent tenir.
 *
 * Elles sont déclarées ici plutôt que dans le test parce qu'elles font partie
 * de la description de la palette : dire « cette encre est faite pour ce sol »
 * est une affirmation de design, que le test se contente de vérifier.
 *
 * 4,5:1 est le seuil AA du texte courant (WCAG 1.4.3). Les trois paires
 * retenues sont celles qu'on lit vraiment : le texte sur le sol, le texte sur
 * la carte, et la méta sur la carte.
 */
export interface ContrastPair {
  readonly theme: 'light' | 'dark';
  readonly ink: string;
  readonly ground: string;
  readonly label: string;
}

export const OPALE_TEXT_PAIRS: readonly ContrastPair[] = [
  { theme: 'light', ink: '#14100b', ground: '#f7f4ef', label: 'texte sur le sol, clair' },
  { theme: 'light', ink: '#14100b', ground: '#ffffff', label: 'texte sur la carte, clair' },
  { theme: 'light', ink: '#5c574d', ground: '#ffffff', label: 'méta sur la carte, clair' },
  { theme: 'dark', ink: '#f3f1ec', ground: '#0c0f0d', label: 'texte sur le sol, sombre' },
  { theme: 'dark', ink: '#f3f1ec', ground: '#262c27', label: 'texte sur la carte, sombre' },
  { theme: 'dark', ink: '#b8b3a7', ground: '#262c27', label: 'méta sur la carte, sombre' },
];
