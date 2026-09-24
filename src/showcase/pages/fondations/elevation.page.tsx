import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const elevationPage: DocPage = {
  slug: 'elevation',
  label: 'Élévation',
  group: 'fondations',
  title: 'Élévation',
  lede: (
    <>
      Quatre crans, et une inversion de polarité :{' '}
      <strong>en clair, c’est l’ombre qui sépare</strong> la plaque du sol (ΔE 20,6 ; un liseré
      blanc y plafonne à ΔE 4,0), <strong>en sombre, c’est le liseré</strong> (une ombre composée y
      mesure ΔE 2,2). Les deux sont donc toujours posés ensemble.
    </>
  ),
  render: lazyPage(() => import('./elevation').then((module) => module.default)),
};
