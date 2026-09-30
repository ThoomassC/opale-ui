import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const topbarPage: DocPage = {
  slug: 'composants/topbar',
  label: 'Topbar',
  group: 'composants',
  title: 'Topbar',
  lede: (
    <>
      Une barre d’application en verre, rendue comme un vrai <code>&lt;header&gt;</code> — donc un
      point de repère correct. Cinq parties composées : <code>Topbar</code>, <code>.Section</code>,{' '}
      <code>.Brand</code>, <code>.Actions</code>, <code>.Divider</code>. Le <strong>seul</strong>{' '}
      composant de la librairie qui n’a aucun état, aucun contexte de valeur et rien à contrôler :
      c’est de la mise en page.
    </>
  ),
  render: lazyPage(() => import('./topbar').then((module) => module.default)),
};
