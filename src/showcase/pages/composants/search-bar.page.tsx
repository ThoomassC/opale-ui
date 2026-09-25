import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const searchBarPage: DocPage = {
  slug: 'composants/search-bar',
  label: 'SearchBar',
  group: 'composants',
  title: 'SearchBar',
  lede: 'La barre de recherche Opale utilisée dans l’en-tête et les filtres, en surface pleine ou en verre.',
  render: lazyPage(() => import('./search-bar').then((module) => module.default)),
};
