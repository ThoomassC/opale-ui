import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const typographiePage: DocPage = {
  slug: 'typographie',
  label: 'Typographie',
  group: 'fondations',
  title: 'Typographie',
  lede: (
    <>
      Huit pas, rapports 1,15 en bas d’échelle et 1,20 en haut. Quatre familles pour trois emplois :
      Bricolage Grotesque aux titres, Chivo au reste, Hack au code.
    </>
  ),
  render: lazyPage(() => import('./typographie').then((module) => module.default)),
};
