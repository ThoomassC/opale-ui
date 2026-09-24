import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const verrePage: DocPage = {
  slug: 'verre',
  label: 'Verre',
  group: 'fondations',
  title: 'Verre',
  lede: (
    <>
      Onze jetons de matériau — remplissage, flou, ménisque, liseré, spéculaire, ombre — toujours
      publiés et toujours mesurés par le contrat. <strong>Plus rien ne les applique</strong> : la
      feuille et les composants qui les consommaient ne sont pas dans la 2.0.
    </>
  ),
  render: lazyPage(() => import('./verre').then((module) => module.default)),
};
