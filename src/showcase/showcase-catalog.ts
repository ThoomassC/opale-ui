import { CATALOG, type ShowcaseCatalogEntry } from '../opale/catalog';

/* =============================================================================
   LES FICHES DE LA VITRINE : LE CATALOGUE DU PAQUET, PLUS CE QUI LUI MANQUE.

   `CATALOG` (`src/opale/catalog.ts`) donne à chaque composant son nom, sa
   famille et sa phrase de présentation. La 2.10.0 publie sept composants que
   ce fichier du paquet ne recense pas encore. Plutôt que de les laisser sans
   page — ce que `registry.test.tsx` refuse —, la vitrine leur écrit ici leur
   fiche, dans la même forme.

   LE CATALOGUE DU PAQUET GAGNE. Une fiche ajoutée plus tard à `CATALOG` sous
   le même nom remplace celle-ci sans rien changer à l'adresse de la page :
   la liste ci-dessous ne sert que les noms qui y manquent encore.

   Les familles reprennent celles des sections du sommaire (`doc-model.ts`),
   sauf « Couches flottantes », qui range les trois surimpressions ancrées, et
   « Mouvement », qui ouvre la famille des composants animés de la 3.0.
   ========================================================================== */

const SHOWCASE_ONLY_ENTRIES: readonly ShowcaseCatalogEntry[] = [
  [
    'Textarea',
    'Inputs',
    'Zone de texte multiligne, hauteur automatique et compteur de caractères annoncé.',
  ],
  ['RadioGroup', 'Inputs', 'Groupe de boutons radio natifs, légende, aide et erreur annoncée.'],
  ['Field', 'Inputs', 'Libellé, aide et erreur autour d’un contrôle écrit par l’application.'],
  ['Grid', 'Mise en page', 'Grille générique : colonnes égales ou pistes à largeur minimale.'],
  ['Tooltip', 'Couches flottantes', 'Infobulle au survol et au focus, qui décrit son déclencheur.'],
  ['Popover', 'Couches flottantes', 'Panneau interactif ancré à un bouton, non modal par défaut.'],
  [
    'DropdownMenu',
    'Couches flottantes',
    'Menu d’actions au clavier : éléments, cases à cocher et choix exclusifs.',
  ],
  [
    'Carousel',
    'Mouvement',
    'Carrousel au défilement natif : glisser, flèches, points, clavier et lecture automatique.',
  ],
  [
    'Reveal',
    'Mouvement',
    'Bloc qui monte en fondu à son entrée dans la vue, visible au repos et sans script.',
  ],
  [
    'Marquee',
    'Mouvement',
    'Bandeau qui défile en boucle sans couture, avec un bouton pause, immobile au repos.',
  ],
].map(([name, category, description]) => ({ name, category, description }));

const PUBLISHED_NAMES = new Set(CATALOG.map((entry) => entry.name));

/** Les fiches de la vitrine, dans l'ordre : le catalogue du paquet, puis ses ajouts. */
export const SHOWCASE_CATALOG: readonly ShowcaseCatalogEntry[] = [
  ...CATALOG,
  ...SHOWCASE_ONLY_ENTRIES.filter((entry) => !PUBLISHED_NAMES.has(entry.name)),
];
