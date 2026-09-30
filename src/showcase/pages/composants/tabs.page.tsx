import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const tabsPage: DocPage = {
  slug: 'composants/tabs',
  label: 'Tabs',
  group: 'composants',
  title: 'Tabs',
  lede: (
    <>
      Quatre parties composées — <code>Tabs</code>, <code>Tabs.List</code>,{' '}
      <code>Tabs.Trigger</code>, <code>Tabs.Content</code> —, les rôles ARIA du motif tabulaire au
      complet, les identifiants appariés par <code>useId</code>, un seul arrêt de tabulation pour
      tout le groupe et la navigation par flèches avec <kbd>Origine</kbd> et <kbd>Fin</kbd>.
      Contrôlé ou non, au choix. <strong>Réécrit par Opale</strong> : c’était le plus gros des
      composants repris ailleurs, et un motif d’accessibilité ne se recopie pas — il se tient.
    </>
  ),
  render: lazyPage(() => import('./tabs').then((module) => module.default)),
};
