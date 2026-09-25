import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const pageScaffoldPage: DocPage = {
  slug: 'composants/page-scaffold',
  label: 'PageScaffold',
  group: 'composants',
  title: 'PageScaffold',
  lede: 'Une page Opale prête à adapter : en-tête, marque, navigation responsive, recherche, contenu et pied de page.',
  searchTerms: ['gabarit', 'page', 'header', 'footer', 'navigation', 'recherche', 'copyright'],
  render: lazyPage(() => import('./page-scaffold').then((module) => module.default)),
};
