import type { CarouselLabels } from '../../../opale';
import type { Language } from '../../localization';

/* =============================================================================
   LES TEXTES DE L'ACCUEIL, DANS LES TROIS LANGUES DE L'INTERFACE.

   L'accueil est la seule page qui traduit son corps : c'est une page pleine
   largeur (`fullBleed`), et la coquille lui passe la langue choisie. Les
   autres pages restent en français, sous l'avis de la coquille.

   AUCUN CHIFFRE ÉCRIT À LA MAIN. Le nombre de composants vient du catalogue,
   la version de `version.ts` : les fonctions ci-dessous les reçoivent, pour
   qu'aucune phrase ne vieillisse à la prochaine publication.
   ========================================================================== */

/** Les familles du carrousel, dans l'ordre des diapositives. */
export type HomeFamilyId =
  'saisie' | 'formulaires' | 'couches' | 'affichage' | 'navigation' | 'mouvement';

export const HOME_FAMILIES: readonly HomeFamilyId[] = [
  'saisie',
  'formulaires',
  'couches',
  'affichage',
  'navigation',
  'mouvement',
];

export interface HomeFamilyCopy {
  /** Le nom de la famille, titre de la diapositive. */
  readonly name: string;
  /** Une ligne : ce que la famille apporte. */
  readonly line: string;
  /** Le lien vers la page qui ouvre la famille. */
  readonly link: string;
}

export interface HomeCopy {
  readonly hero: {
    readonly eyebrow: (version: string) => string;
    readonly title: string;
    readonly lede: string;
    readonly install: string;
    readonly components: string;
  };
  readonly components: {
    readonly title: string;
    readonly lede: (count: number) => string;
    /** Le nom de la région du carrousel. */
    readonly carousel: string;
    readonly carouselLabels: Partial<CarouselLabels>;
    readonly families: Readonly<Record<HomeFamilyId, HomeFamilyCopy>>;
    /** Les textes des démonstrations, famille par famille. */
    readonly demos: {
      readonly primary: string;
      readonly secondary: string;
      readonly tonal: string;
      readonly glass: string;
      readonly message: string;
      readonly messageHelp: string;
      readonly messageValue: string;
      readonly popoverTrigger: string;
      readonly popoverTitle: string;
      readonly popoverBody: string;
      readonly stable: string;
      readonly fresh: string;
      readonly offline: string;
      readonly tabsLabel: string;
      readonly tabs: readonly (readonly [string, string])[];
      readonly replay: string;
      readonly splitTitle: string;
    };
  };
}

const FR: HomeCopy = {
  hero: {
    eyebrow: (version) => `Opale UI ${version} · design system React`,
    title: 'Des interfaces qui bougent, sans rien cacher.',
    lede: 'Des composants React accessibles et typés, rendus au serveur, avec le verre liquide en option.',
    install: 'Installer',
    components: 'Voir les composants',
  },
  components: {
    title: 'Les composants',
    lede: (count) => `${count} composants, rangés en familles. Chaque carte est une démo vivante.`,
    carousel: 'Les familles de composants',
    carouselLabels: {},
    families: {
      saisie: {
        name: 'Saisie',
        line: 'Des boutons à chaque ton, à la hauteur des champs.',
        link: 'Voir Button',
      },
      formulaires: {
        name: 'Formulaires',
        line: 'Libellé, aide et erreur, reliés au champ.',
        link: 'Voir Textarea',
      },
      couches: {
        name: 'Couches flottantes',
        line: 'Un panneau contre son bouton. Échap le referme.',
        link: 'Voir Popover',
      },
      affichage: {
        name: 'Affichage',
        line: 'Des pastilles, des cartes et des tableaux.',
        link: 'Voir Badge',
      },
      navigation: {
        name: 'Navigation',
        line: 'Des onglets qui se parcourent aux flèches.',
        link: 'Voir Tabs',
      },
      mouvement: {
        name: 'Mouvement',
        line: 'Un titre qui arrive mot à mot, immobile en mouvement réduit.',
        link: 'Voir SplitHeading',
      },
    },
    demos: {
      primary: 'Valider',
      secondary: 'Annuler',
      tonal: 'Brouillon',
      glass: 'En verre',
      message: 'Message',
      messageHelp: 'Le champ grandit avec le texte.',
      messageValue: 'Bonjour, je voudrais un devis.',
      popoverTrigger: 'Ouvrir le panneau',
      popoverTitle: 'Un panneau ancré',
      popoverBody: 'Il suit son bouton et rend le focus à la fermeture.',
      stable: 'Stable',
      fresh: 'Nouveau',
      offline: 'Hors ligne',
      tabsLabel: 'Étapes',
      tabs: [
        ['Installer', 'Une commande, une archive.'],
        ['Importer', 'Une feuille, une fois.'],
        ['Composer', 'Des composants par leur nom.'],
      ],
      replay: 'Rejouer',
      splitTitle: 'Un titre qui prend son temps.',
    },
  },
};

/* L'anglais et l'espagnol suivent : en attendant, le français. */
export const HOME_COPY: Readonly<Record<Language, HomeCopy>> = {
  FR,
  EN: FR,
  ES: FR,
};
