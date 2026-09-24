import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const sidebarPage: DocPage = {
  slug: 'composants/sidebar',
  label: 'Sidebar',
  group: 'composants',
  title: 'Sidebar',
  lede: (
    <>
      Une barre latérale de verre en cinq parties composées — <code>Sidebar</code>,{' '}
      <code>.Header</code>, <code>.Items</code>, <code>.Item</code>, <code>.Footer</code>, plus{' '}
      <code>.Toggle</code>. Elle rend un vrai <code>&lt;aside&gt;</code> et un vrai{' '}
      <code>&lt;nav&gt;</code> <em>nommé</em>, donc deux points de repère corrects ; ses entrées, en
      revanche, sont des <code>&lt;button&gt;</code> et non des liens.
    </>
  ),
  render: lazyPage(() => import('./sidebar').then((module) => module.default)),
};
