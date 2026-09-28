import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const accessibilitePage: DocPage = {
  slug: 'accessibilite',
  label: 'Accessibilité',
  group: 'fondations',
  title: 'Le contrat d’accessibilité',
  lede: (
    <>
      Deux engagements portés par les jetons, vérifiables sur cette page : le focus se voit sur
      n’importe quel fond, et rien de cliquable ne descend sous la taille du doigt.{' '}
      Les composants publiés portent leur propre anneau de focus, sur les jetons{' '}
      <code>--opale-*</code>.
    </>
  ),
  render: lazyPage(() => import('./accessibilite').then((module) => module.default)),
};
