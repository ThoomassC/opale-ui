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
      <strong>Ce contrat ne couvre pas les quatorze composants publiés</strong> — ils sont vendorés
      et n’emploient aucun de ces jetons.
    </>
  ),
  render: lazyPage(() => import('./accessibilite').then((module) => module.default)),
};
