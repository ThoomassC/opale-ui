import { OPALE_CATALOG } from '../../magic';
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
  DataTable: ['sortable', 'sortValue', 'tri'],
  Dropzone: ['FileUploader', 'glisser déposer', 'drag and drop'],
  Feedback: ['Http', 'Validation', 'severity'],
  IconActionButton: ['icon', 'share', 'bouton icône'],
  Lightbox: ['alt', 'texte alternatif'],
  Menu: ['SettingsMenu'],
  SegmentedControl: ['SlidingIndicator'],
  Select: ['LanguageSelector'],
  SvgMap: ['Map'],
  Toast: ['tone', 'placement', 'notification'],
  Toggle: ['ThemeToggle', 'Sound'],
} as const;

/* =============================================================================
   LES PAGES DU CATALOGUE, SANS LEUR CONTENU.

   Les quarante-neuf pages de composants tirent leurs métadonnées du catalogue,
   déjà présent dans le paquet : seule `ComponentPage` — et ses aperçus
   interactifs — part dans un morceau chargé à la première page de composant
   ouverte.

   LE COMMUTATEUR DE MATÉRIAU SE REMET À ZÉRO EN CHANGEANT DE COMPOSANT. Toutes
   ces pages rendaient le MÊME élément `ComponentPage`, qu'une clé par nom
   forçait à remonter : sans elle, le verre activé sur `FileCard` suivait sur
   « Feedback ». Chaque appel à `lazyPage` crée désormais sa propre passerelle,
   c'est-à-dire un type de composant distinct par page : React remonte donc la
   page à chaque changement, et la clé n'a plus d'objet.
   ========================================================================== */
export const opaleComponentPages: readonly DocPage[] = OPALE_CATALOG.map((entry) => ({
  slug: catalogComponentSlug(entry.name),
  label: catalogComponentLabel(entry.name),
  group: 'composants',
  title: catalogComponentLabel(entry.name),
  searchTerms: [entry.description, ...(COMPONENT_SEARCH_TERMS[entry.name] ?? [])],
  /* LA CARTE SVG A SA PAGE PROPRE. Refondue en 3.5.0, elle se démontre sur
     trois scènes et trois tables d'interface, ce que le gabarit commun d'une
     fiche ne sait pas porter. L'adresse, elle, ne change pas. */
  render:
    entry.name === 'SvgMap'
      ? lazyPage(() => import('./composants/svg-map/svg-map').then((module) => module.default))
      : lazyPage(() => import('./opale-components').then((module) => module.ComponentPage), {
          entry,
        }),
}));
