import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const espacementPage: DocPage = {
  slug: 'espacement',
  label: 'Espacement et rayons',
  group: 'fondations',
  title: 'Espacement et rayons',
  lede: (
    <>
      Une grille de 4 px, huit pas, aucune valeur hors liste. Deux exceptions, hors échelle parce
      qu’elles répondent au doigt : <code className="tc-doc-inlinecode">--target-min</code> (44 px)
      et <code className="tc-doc-inlinecode">--target-button</code> (48 px).
    </>
  ),
  render: lazyPage(() => import('./espacement').then((module) => module.default)),
};
