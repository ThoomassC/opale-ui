import { SHOWCASE_CATALOG } from '../showcase-catalog';
import { catalogComponentLabel, catalogComponentSlug } from '../doc-model';
import type { DocPage } from '../doc-model';
import { lazyPage } from './lazy-page';

const COMPONENT_SEARCH_TERMS: Readonly<Record<string, readonly string[]>> = {
  BackgroundSurface: ['Background', 'ShapeBackground', 'shape'],
  Badge: ['StatusChip', 'Http', 'Validation', 'dot'],
  Button: [
    'AddButton',
    'SaveButton',
    'ApproveButton',
    'EditButton',
    'DeleteButton',
    'variant',
    'loading',
  ],
  Card: ['liquidGlass', 'elevation'],
  CardGrid: ['Carousel'],
  DataTable: ['sortable', 'sortValue', 'tri', 'cell', 'getRowId', 'selectable', 'sélection'],
  DropdownMenu: [
    'DropdownMenuTrigger',
    'DropdownMenuContent',
    'DropdownMenuItem',
    'DropdownMenuCheckboxItem',
    'DropdownMenuRadioGroup',
    'DropdownMenuRadioItem',
    'DropdownMenuSeparator',
    'menu déroulant',
    'menu d’actions',
  ],
  Carousel: ['CarouselSlide', 'carrousel', 'diaporama', 'slider', 'autoPlay', 'scroll-snap'],
  Marquee: ['bandeau', 'défilant', 'ticker', 'boucle', 'marquee', 'pause'],
  SplitHeading: ['titre', 'mots', 'cascade', 'split text', 'heading', 'stagger'],
  ScrollSection: ['ScrollStage', 'ScrollGround', 'fond', 'section active', 'défilement', 'scroll'],
  Reveal: ['apparition', 'défilement', 'scroll', 'animation-timeline', 'cascade', 'stagger'],
  Dropzone: ['FileUploader', 'glisser déposer', 'drag and drop'],
  Feedback: ['Http', 'Validation', 'tone', 'severity'],
  Field: ['useFieldProps', 'FieldWrapperProps', 'champ', 'contrôle personnalisé'],
  Grid: ['grille', 'colonnes', 'columns'],
  IconActionButton: ['icon', 'share', 'bouton icône'],
  Lightbox: ['alt', 'texte alternatif'],
  Menu: ['SettingsMenu'],
  Popover: ['PopoverTrigger', 'PopoverContent', 'panneau', 'dialog'],
  RadioGroup: ['Radio', 'bouton radio', 'radiogroup', 'choix unique'],
  SegmentedControl: ['SlidingIndicator'],
  Select: ['LanguageSelector'],
  SvgMap: ['Map'],
  Textarea: ['zone de texte', 'multiligne', 'autoResize', 'showCount', 'compteur'],
  Toast: ['tone', 'placement', 'notification'],
  Toggle: ['ThemeToggle', 'Sound'],
  Tooltip: ['infobulle', 'survol'],
  WorldMap: ['carte', 'monde', 'globe', 'satellite', 'repère', 'pin', 'Map'],
} as const;

/* Les pages du catalogue, sans leur contenu : les métadonnées viennent du
   catalogue, et seule `ComponentPage` part dans un morceau chargé à la première
   page de composant. Chaque `lazyPage` crée son propre type de composant :
   changer de page remonte donc le commutateur de matériau. */
export const opaleComponentPages: readonly DocPage[] = SHOWCASE_CATALOG.map((entry) => ({
  slug: catalogComponentSlug(entry.name),
  label: catalogComponentLabel(entry.name),
  group: 'composants',
  title: catalogComponentLabel(entry.name),
  searchTerms: [entry.description, ...(COMPONENT_SEARCH_TERMS[entry.name] ?? [])],
  /* LES CARTES ONT LEUR PAGE PROPRE. Refondue en 2.5.0, la carte SVG se
     démontre sur trois scènes et trois tables d'interface, ce que le gabarit
     commun d'une fiche ne sait pas porter ; la carte du monde charge ses
     données et se pilote de l'extérieur. L'adresse, elle, ne change pas. */
  render:
    entry.name === 'SvgMap'
      ? lazyPage(() => import('./composants/svg-map/svg-map').then((module) => module.default))
      : entry.name === 'WorldMap'
        ? lazyPage(() =>
            import('./composants/world-map/world-map').then((module) => module.default),
          )
        : lazyPage(() => import('./opale-components').then((module) => module.ComponentPage), {
            entry,
          }),
}));
