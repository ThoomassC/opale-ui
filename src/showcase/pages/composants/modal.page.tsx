import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const modalPage: DocPage = {
  slug: 'composants/modal',
  label: 'Modal',
  group: 'composants',
  title: 'Modal',
  lede: (
    <>
      Une boîte de dialogue de verre, portaillée dans <code>document.body</code>. C’est le composant
      le plus outillé de la librairie après <code>Tabs</code> : <code>role=&quot;dialog&quot;</code>
      , <code>aria-modal</code>, identifiants par <code>useId</code>, verrou de défilement qui
      restaure la valeur précédente, fermeture par <kbd>Échap</kbd> et par le voile, focus donné au
      panneau à l’ouverture, <strong>piégé le temps de l’ouverture</strong> et{' '}
      <strong>rendu au déclencheur à la fermeture</strong>, arrière-plan rendu inerte.
    </>
  ),
  render: lazyPage(() => import('./modal').then((module) => module.default)),
};
