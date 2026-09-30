import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const toastPage: DocPage = {
  slug: 'composants/toast-provider',
  label: 'ToastProvider',
  group: 'composants',
  title: 'ToastProvider',
  lede: (
    <>
      Le seul composant de la librairie qui ne s’importe pas comme un composant : c’est un{' '}
      <strong>fournisseur plus un hook</strong>. <code>ToastProvider</code> enveloppe l’arbre et
      porte la file, <code>useToast()</code> donne <code>showToast</code>, <code>dismissToast</code>{' '}
      et <code>clearToasts</code>, et les toasts se peignent dans un portail sur{' '}
      <code>document.body</code>. Cinq variantes, six positions, quatre animations.
    </>
  ),
  render: lazyPage(() => import('./toast').then((module) => module.default)),
};
