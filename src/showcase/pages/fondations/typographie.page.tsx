import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const typographiePage: DocPage = {
  slug: 'typographie',
  label: 'Typographie',
  group: 'fondations',
  title: 'Typographie',
  lede: (
    <>
      Trois voix et deux échelles : Bricolage Grotesque pour les titres, Chivo pour lire, Hack pour
      le code et les légendes ; l’échelle fluide de la planche pour le site, et six pas pour les
      composants.
    </>
  ),
  render: lazyPage(() => import('./typographie').then((module) => module.default)),
};
