import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const palettePage: DocPage = {
  slug: 'palette',
  label: 'La palette',
  group: 'fondations',
  title: 'La palette',
  lede: (
    <>
      D’abord la palette qui peint ce site, ensuite celle que publie le paquet. Les plaques sont
      rendues avec leurs hexadécimaux littéraux et ne suivent donc pas le thème de la page. Les
      jetons translucides affichent leur valeur <code>rgba()</code> déclarée puis l’aplat qu’elle
      donne sur son support — c’est cet aplat que la pastille peint.
    </>
  ),
  render: lazyPage(() => import('./palette').then((module) => module.default)),
};
