import { OPALE_CATALOG } from '../../magic';
import { catalogComponentLabel, catalogComponentSlug } from '../doc-model';
import type { DocPage } from '../doc-model';
import { lazyPage } from './lazy-page';

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
  render: lazyPage(() => import('./opale-components').then((module) => module.ComponentPage), {
    entry,
  }),
}));
